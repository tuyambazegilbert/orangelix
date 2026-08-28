import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { firebaseEnabled } from '@/lib/firebase';
import { ShieldCheck, Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromLocation = (location.state as { from?: { pathname?: string } })?.from?.pathname;

  const handleRedirect = (user: { isAdmin?: boolean }) => {
    if (user.isAdmin) {
      toast.success('Welcome back, Administrator!', {
        description: 'Redirecting to your Admin Command Center...',
      });
      navigate('/admin', { replace: true });
    } else {
      toast.success('Welcome back to OrangeFlix!');
      navigate(fromLocation || '/', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await login(email, password);
      if (user) {
        handleRedirect(user);
      } else {
        toast.error('Invalid credentials', {
          description: 'Please check your email and password.',
        });
      }
    } catch {
      toast.error('Login failed', {
        description: 'An unexpected error occurred. Please try again.',
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
        handleRedirect(user);
      } else {
        toast.error('Google sign-in incomplete', {
          description: firebaseEnabled
            ? 'Sign-in window was closed or canceled.'
            : 'Firebase is not yet configured. Please set your credentials in .env.',
        });
      }
    } catch {
      toast.error('Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

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
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold shadow-lg shadow-orange-950/50 py-2.5"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
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
            className="w-full border-gray-700 bg-white/[.04] text-white hover:bg-white/[.08] py-2.5"
          >
            <span className="mr-2 grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] font-black text-[#4285F4]">
              G
            </span>
            Continue with Google
          </Button>

          

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-orange-400 hover:text-orange-300 font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
