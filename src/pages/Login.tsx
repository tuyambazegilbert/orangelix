import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import GoogleOneTap from '@/components/GoogleOneTap';
import { toast } from 'sonner';
import { Lock, Link2, RefreshCw, AlertCircle } from 'lucide-react';
import { User } from '@/types';

function getAuthErrorMessage(code?: string): string {
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Please allow popups for OrangeFlix and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email address using password sign-in. Please link your account.';
    case 'auth/credential-already-in-use':
      return 'This Google account is already linked to another user account.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Console. Add it in Firebase Console > Auth > Settings > Authorized Domains.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials and try again.';
    case 'auth/user-not-found':
      return 'No account found with this email address. Please create an account first.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact OrangeFlix support.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Access is temporarily blocked. Please try again later or reset your password.';
    default:
      return 'Authentication failed. Please check your details and try again.';
  }
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLinkingLoading, setIsLinkingLoading] = useState(false);

  const {
    login,
    loginWithGoogle,
    isLinkingAccount,
    pendingLinkEmail,
    linkAccountWithPassword,
    cancelAccountLinking,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const fromLocation = (location.state as { from?: { pathname?: string } })?.from?.pathname;

  const handleAuthSuccess = (user: User) => {
    if (user.isAdmin) {
      toast.success('Welcome back, Administrator!', {
        description: 'Redirecting to your Admin Command Center...',
      });
      navigate('/admin', { replace: true });
    } else {
      toast.success(`Welcome back, ${user.name || 'member'}!`);
      navigate(fromLocation || '/', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await login(email, password);
      if (user) {
        handleAuthSuccess(user);
      }
    } catch (err: unknown) {
      const error = err as { code?: string };
      toast.error('Login Failed', {
        description: getAuthErrorMessage(error.code),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        handleAuthSuccess(user);
      }
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === 'auth/account-exists-with-different-credential') {
        toast.info('Account exists', {
          description: 'Please enter your password to link your Google account.',
        });
      } else {
        toast.error('Google Sign-In Failed', {
          description: getAuthErrorMessage(error.code),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkPassword) {
      toast.error('Password is required to link accounts.');
      return;
    }

    setIsLinkingLoading(true);
    try {
      const user = await linkAccountWithPassword(linkPassword);
      if (user) {
        toast.success('Account linked successfully!', {
          description: 'You can now sign in with either your password or Google account.',
        });
        handleAuthSuccess(user);
      }
    } catch (err: unknown) {
      const error = err as { code?: string };
      toast.error('Linking Failed', {
        description: getAuthErrorMessage(error.code),
      });
    } finally {
      setIsLinkingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Google One Tap */}
      <GoogleOneTap onSuccess={handleAuthSuccess} />

      {/* Main Login Card */}
      <Card className="w-full max-w-md bg-gray-900/90 border-orange-500/30 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="space-y-3">
          <Link to="/" className="flex flex-col items-center justify-center gap-2 group mb-1">
            <img
              src="/android-chrome-192x192.png"
              alt="OrangeFlix logo"
              className="h-12 w-12 object-contain drop-shadow-[0_2px_12px_rgba(249,115,22,0.5)] group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-bold tracking-tight text-white">
              Orange<span className="text-orange-400">Flix</span>
            </span>
          </Link>
          <CardTitle className="text-2xl text-center text-white font-bold">Welcome Back</CardTitle>
          <p className="text-gray-400 text-center text-sm">
            Sign in to access your watchlist, recommendations, and custom library
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-950/80 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500"
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white text-sm font-medium">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-950/80 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold shadow-lg shadow-orange-950/50 py-2.5"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-gray-500">
            <span className="h-px flex-1 bg-gray-800" />
            <span>or continue with</span>
            <span className="h-px flex-1 bg-gray-800" />
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            variant="outline"
            className="w-full border-gray-700 bg-white/[.04] text-white hover:bg-white/[.08] py-2.5 flex items-center justify-center gap-3"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-orange-400 hover:text-orange-300 font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Linking Dialog */}
      <Dialog open={isLinkingAccount} onOpenChange={(open) => !open && cancelAccountLinking()}>
        <DialogContent className="bg-gray-900 border-orange-500/40 text-white max-w-md shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto">
              <Link2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-bold text-center text-white">
              Link Your Google Account
            </DialogTitle>
            <DialogDescription className="text-gray-300 text-center text-sm">
              An account already exists for <strong className="text-white">{pendingLinkEmail}</strong>.
              Enter your password once to verify ownership and link your Google account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLinkAccount} className="space-y-4 pt-2">
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Linking unifies your existing watchlist, favorites, and profile under a single OrangeFlix account.
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkPassword" className="text-white text-xs font-semibold">
                Account Password
              </Label>
              <div className="relative">
                <Input
                  id="linkPassword"
                  type="password"
                  value={linkPassword}
                  onChange={(e) => setLinkPassword(e.target.value)}
                  required
                  className="bg-gray-950 border-gray-700 text-white pl-9"
                  placeholder="Enter your existing password"
                  autoFocus
                />
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={cancelAccountLinking}
                className="flex-1 border-gray-700 text-gray-300 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLinkingLoading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold shadow-lg shadow-orange-950/40"
              >
                {isLinkingLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Linking...
                  </>
                ) : (
                  'Link Account'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
