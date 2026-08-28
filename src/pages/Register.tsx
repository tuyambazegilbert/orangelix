import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromLocation = (location.state as { from?: { pathname?: string } })?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match', {
        description: 'Please ensure both password fields match exactly.',
      });
      return;
    }

    if (password.length < 6) {
      toast.error('Password too short', {
        description: 'Password must be at least 6 characters.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const user = await register(email, password, name);
      if (user) {
        toast.success('Account created successfully!', {
          description: `Welcome to OrangeFlix, ${name}!`,
        });
        if (user.isAdmin) {
          navigate('/admin', { replace: true });
        } else {
          navigate(fromLocation || '/', { replace: true });
        }
      } else {
        toast.error('Registration failed', {
          description: 'This email may already be registered or invalid.',
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
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
          <CardTitle className="text-2xl text-center text-white font-bold">Create Account</CardTitle>
          <p className="text-gray-400 text-center text-sm">Join OrangeFlix for unlimited cinema streaming</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-gray-950/80 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500"
                placeholder="Alex Morgan"
              />
            </div>

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
                placeholder="alex@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-950/80 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500"
                placeholder="At least 6 characters"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white text-sm font-medium">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-gray-950/80 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500"
                placeholder="Re-enter your password"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold shadow-lg shadow-orange-950/50 py-2.5 mt-2"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-orange-400 hover:text-orange-300 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}