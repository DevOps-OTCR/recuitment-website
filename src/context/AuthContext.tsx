import { type AccountInfo } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { defaultAppPathForUser, roleRouteMap, type AdminAuthenticatedUser } from '@/lib/admin-auth';
import { apiFetch, setAccessTokenProvider } from '@/lib/api-client';
import {
  acquireAccessToken,
  consumePostLoginPath,
  getActiveMsalAccount,
  initializeMsal,
  isMsalConfigured,
  loginWithRedirect,
  logoutWithRedirect,
  msalInstance,
} from '@/lib/authConfig';

type AuthContextValue = {
  account: AccountInfo | null;
  user: AdminAuthenticatedUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
  signIn: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  refreshUser: () => Promise<AdminAuthenticatedUser | null>;
  consumePostLoginPath: () => string | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function AuthProviderInner({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [user, setUser] = useState<AdminAuthenticatedUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isConfigured = isMsalConfigured();

  const clearSessionState = useCallback(() => {
    setAccount(null);
    setAccessToken(null);
    setUser(null);
    setError(null);
  }, []);

  const refreshUser = useCallback(async (options?: { token?: string | null }): Promise<AdminAuthenticatedUser | null> => {
    setIsLoading(true);

    try {
      await initializeMsal();
      const activeAccount = getActiveMsalAccount();
      setAccount(activeAccount);

      if (!activeAccount) {
        clearSessionState();
        return null;
      }

      const token = options?.token ?? await acquireAccessToken();
      setAccessToken(token);

      if (!token) {
        setUser(null);
        setError(null);
        return null;
      }

      const backendUser = await apiFetch<AdminAuthenticatedUser>('/api/auth/me', {
        auth: false,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeoutMs: 5000,
      });
      setUser(backendUser);
      setError(null);
      return backendUser;
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unable to initialize authentication.';
      setError(message);
      setAccessToken(null);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [clearSessionState]);

  useEffect(() => {
    setAccessTokenProvider(() => acquireAccessToken());

    let isCancelled = false;

    const initializeAuth = async () => {
      const currentHash = typeof window !== 'undefined' ? window.location.hash : '';
      const hasRedirectHash =
        currentHash.includes('#code=') ||
        currentHash.includes('#id_token=') ||
        currentHash.includes('&code=') ||
        currentHash.includes('&id_token=');

      try {
        await initializeMsal();
        const response = await msalInstance.handleRedirectPromise();
        const handledAccount = response?.account ?? getActiveMsalAccount();
        const redirectToken = response?.accessToken ?? null;
        const shouldRedirectToRoleRoute = Boolean(response || hasRedirectHash);

        if (handledAccount) {
          msalInstance.setActiveAccount(handledAccount);
        }

        const backendUser = isCancelled ? null : await refreshUser({ token: redirectToken });

        if (!isCancelled && shouldRedirectToRoleRoute) {
          const destination = backendUser?.role ? roleRouteMap[backendUser.role] ?? '/sign-in' : '/sign-in';
          window.history.replaceState(
            null,
            document.title,
            `${window.location.pathname}${window.location.search}#${destination}`
          );
          navigate(destination, { replace: true });
        }

      } catch (authError) {
        if (isCancelled) {
          return;
        }

        const message =
          authError instanceof Error ? authError.message : 'Unable to initialize authentication.';
        setError(message);
        clearSessionState();
        setIsLoading(false);
      }
    };

    void initializeAuth();

    return () => {
      isCancelled = true;
      setAccessTokenProvider(null);
    };
  }, [clearSessionState, navigate, refreshUser]);

  useEffect(() => {
    const isSignInRoute =
      location.pathname === '/sign-in' ||
      location.pathname === '/tech/sign-in' ||
      location.pathname === '/devops/sign-in';

    if (!isSignInRoute || isLoading || !user || !account || !accessToken) {
      return;
    }

    const destination = defaultAppPathForUser(user);
    if (destination !== location.pathname) {
      navigate(destination, { replace: true });
    }
  }, [accessToken, account, isLoading, location.pathname, navigate, user]);

  const signIn = useCallback(
    async (redirectTo?: string) => {
      setError(null);
      await loginWithRedirect(redirectTo || '/sign-in');
    },
    []
  );

  const signOut = useCallback(async () => {
    clearSessionState();
    await logoutWithRedirect();
  }, [clearSessionState]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      account,
      user,
      accessToken,
      isAuthenticated: Boolean(account && accessToken),
      isLoading,
      isConfigured,
      error,
      signIn,
      signOut,
      getAccessToken: acquireAccessToken,
      refreshUser,
      consumePostLoginPath,
    }),
    [account, accessToken, error, isConfigured, isLoading, refreshUser, signIn, signOut, user]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </MsalProvider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-sm uppercase tracking-[0.32em] text-muted-foreground">Authenticating</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/sign-in"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  return <>{children}</>;
}
