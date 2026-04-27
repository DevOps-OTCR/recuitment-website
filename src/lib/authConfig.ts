import {
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
  type Configuration,
  type RedirectRequest,
  type SilentRequest,
} from '@azure/msal-browser';

const AUTH_RETURN_TO_STORAGE_KEY = 'otcr_auth_return_to';
const FALLBACK_CLIENT_ID = '00000000-0000-0000-0000-000000000000';
const FALLBACK_AUTHORITY = 'https://login.microsoftonline.com/common';
const FALLBACK_REDIRECT_URI =
  typeof window !== 'undefined' ? `${window.location.origin}/#/sign-in` : 'http://localhost:8080/#/sign-in';

const clientId = import.meta.env.NEXT_PUBLIC_MSAL_CLIENT_ID?.trim() || '';
const authority = import.meta.env.NEXT_PUBLIC_MSAL_AUTHORITY?.trim() || FALLBACK_AUTHORITY;
const redirectUri = import.meta.env.NEXT_PUBLIC_MSAL_REDIRECT_URI?.trim() || FALLBACK_REDIRECT_URI;

export const graphScopes = ['openid', 'profile', 'email', 'User.Read'] as const;

const msalConfig: Configuration = {
  auth: {
    clientId: clientId || FALLBACK_CLIENT_ID,
    authority,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest: RedirectRequest = {
  scopes: [...graphScopes],
  prompt: 'select_account',
};

let initializationPromise: Promise<PublicClientApplication> | null = null;

export function isMsalConfigured(): boolean {
  return Boolean(clientId && authority && redirectUri);
}

export function storePostLoginPath(path: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(AUTH_RETURN_TO_STORAGE_KEY, path);
}

export function consumePostLoginPath(): string | null {
  if (typeof window === 'undefined') return null;
  const path = window.sessionStorage.getItem(AUTH_RETURN_TO_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_RETURN_TO_STORAGE_KEY);
  return path;
}

export function getActiveMsalAccount(): AccountInfo | null {
  return msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0] ?? null;
}

export async function initializeMsal(): Promise<PublicClientApplication> {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await msalInstance.initialize();
      const account = getActiveMsalAccount();
      if (account) {
        msalInstance.setActiveAccount(account);
      }

      return msalInstance;
    })();
  }

  return initializationPromise;
}

export async function loginWithRedirect(returnTo: string = '/tech/manage'): Promise<void> {
  if (!isMsalConfigured()) {
    throw new Error(
      'Missing MSAL configuration. Set NEXT_PUBLIC_MSAL_CLIENT_ID, NEXT_PUBLIC_MSAL_AUTHORITY, and NEXT_PUBLIC_MSAL_REDIRECT_URI.'
    );
  }

  storePostLoginPath(returnTo);
  await initializeMsal();
  await msalInstance.loginRedirect(loginRequest);
}

export async function logoutWithRedirect(): Promise<void> {
  await initializeMsal();
  await msalInstance.logoutRedirect({
    postLogoutRedirectUri: redirectUri,
  });
}

export async function acquireAccessToken(): Promise<string | null> {
  if (!isMsalConfigured()) {
    return null;
  }

  await initializeMsal();
  const account = getActiveMsalAccount();
  if (!account) {
    return null;
  }

  const silentRequest: SilentRequest = {
    scopes: [...graphScopes],
    account,
  };

  try {
    const response: AuthenticationResult = await msalInstance.acquireTokenSilent(silentRequest);
    if (response.account) {
      msalInstance.setActiveAccount(response.account);
    }
    return response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      return null;
    }
    throw error;
  }
}
