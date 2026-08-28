import { FormEvent, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock, CheckCircle2, RefreshCw, KeyRound, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { confirmPasswordReset } = useAuth();

  const oobCode = searchParams.get('oobCode') || searchParams.get('code') || '';
  const mode = searchParams.get('mode') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // If opened without an oobCode in resetPassword mode
    if (!oobCode && mode === 'resetPassword') {
      toast.error('Invalid or expired password reset link.');
    }
  }, [oobCode, mode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('Password too short', {
        description: 'New password must be at least 6 characters.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match', {
        description: 'Please ensure both password fields are identical.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await confirmPasswordReset(oobCode || 'dev-code', newPassword);
      if (ok) {
        setIsSuccess(true);
        toast.success('Password updated successfully!', {
          description: 'You can now sign in with your new password.',
        });
      } else {
        toast.error('Failed to reset password', {
          description: 'The reset link may be expired or already used. Please request a new one.',
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error resetting password.');
    } finally {
      setIsSubmitting(false);
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

          {!isSuccess ? (
            <>
              <div className="mx-auto w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-1">
                <KeyRound className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl text-center text-white font-bold">
                Set New Password
              </CardTitle>
              <CardDescription className="text-gray-400 text-center text-sm">
                Create a strong new password for your OrangeFlix account.
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-1">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl text-center text-white font-bold">
                Password Changed!
              </CardTitle>
              <CardDescription className="text-gray-400 text-center text-sm">
                Your password has been successfully updated.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!oobCode && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>No reset token provided. If testing locally, you can still test updating your password.</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-white text-sm font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="bg-gray-950/80 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500 pl-9"
                    placeholder="At least 6 characters"
                    autoFocus
                  />
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white text-sm font-medium">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-gray-950/80 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500 pl-9"
                    placeholder="Re-enter your new password"
                  />
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold shadow-lg shadow-orange-950/50 py-2.5 mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  'Save New Password'
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 pt-2">
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold shadow-lg shadow-orange-950/50 py-2.5"
              >
                Sign In With New Password
              </Button>
            </div>
          )}

          <div className="mt-6 text-center border-t border-gray-800/80 pt-4">
            <Link
              to="/login"
              className="inline-flex items-center text-xs font-semibold text-gray-400 hover:text-orange-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

