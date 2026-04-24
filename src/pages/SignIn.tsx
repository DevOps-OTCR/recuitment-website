import { Loader2, ShieldCheck } from 'lucide-react';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

const SignIn = () => {
  const { signIn, isAuthenticated, isLoading, isConfigured, error } = useAuth();

  const handleSignIn = async () => {
    await signIn('/sign-in');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="relative overflow-hidden px-6 pb-24 pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,1))]" />
        <div className="relative mx-auto max-w-5xl">
          <div className="mx-auto max-w-xl">
            <Card className="border-white/10 bg-white/[0.04] shadow-2xl shadow-cyan-950/20 backdrop-blur">
              <CardHeader className="space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10">
                  <ShieldCheck className="h-7 w-7 text-cyan-200" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">OTCR Tech Access</p>
                  <CardTitle className="text-3xl text-white">Sign in with NetID</CardTitle>
                  <CardDescription className="text-sm leading-6 text-white/65">
                    Use your Microsoft Entra account to access the recruiting workspace and send a Graph-backed bearer
                    token to the FastAPI backend.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-white/70">
                  Scopes requested: <span className="font-medium text-white">openid</span>,{' '}
                  <span className="font-medium text-white">profile</span>,{' '}
                  <span className="font-medium text-white">email</span>, and{' '}
                  <span className="font-medium text-white">User.Read</span>.
                </div>

                {!isConfigured ? (
                  <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                    Missing MSAL configuration. Set `NEXT_PUBLIC_MSAL_CLIENT_ID`, `NEXT_PUBLIC_MSAL_AUTHORITY`, and
                    `NEXT_PUBLIC_MSAL_REDIRECT_URI` in your frontend environment.
                  </div>
                ) : null}

                {isAuthenticated ? (
                  <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                    Authentication succeeded. Redirecting to your role dashboard.
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                    {error}
                  </div>
                ) : null}

                <Button
                  className="h-12 w-full rounded-xl bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                  onClick={() => void handleSignIn()}
                  disabled={!isConfigured || isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign in with NetID
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default SignIn;
