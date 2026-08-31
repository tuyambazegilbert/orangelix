import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSending(true);
    try {
      const sent = await resetPassword(email);
      if (sent) {
        setIsSubmitted(true);
        startCooldown();
        toast.success('Password reset link sent!', {
          description: `Check your inbox at ${email} for instructions to reset your password.`,
        });
      } else {
        toast.error('Unable to send reset email', {
          description: 'Please ensure the email is correct and try again.',
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send password reset email.');
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isSending) return;
    setIsSending(true);
    try {
      const sent = await resetPassword(email);
      if (sent) {
        startCooldown();
        toast.success('Reset link resent!', {
          description: `A new reset link has been dispatched to ${email}.`,
        });
      } else {
        toast.error('Unable to resend reset email.');
      }
    } finally {
      setIsSending(false);
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

          {!isSubmitted ? (
            <>
              <div className="mx-auto w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-1">
                <Mail className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl text-center text-white font-bold">
                Reset Password
              </CardTitle>
              <CardDescription className="text-gray-400 text-center text-sm">
                Enter your email address and we&apos;ll send you a secure link to reset your account password.
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-1">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl text-center text-white font-bold">
                Check Your Inbox
              </CardTitle>
              <CardDescription className="text-gray-400 text-center text-sm">
                We sent a password reset link to <strong className="text-white">{email}</strong>.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-950/80 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500"
                  placeholder="alex@example.com"
                  autoComplete="email"
                  spellCheck={false}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold shadow-lg shadow-orange-950/50 py-2.5 mt-2"
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                Click the link in the email to choose a new password. If you don&apos;t see the email within a few minutes, check your spam folder.
              </p>

              <div className="pt-2 flex flex-col gap-3">
                <Button
                  variant="outline"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isSending}
                  className="w-full border-gray-700 text-gray-300 hover:text-white"
                >
                  {isSending ? (
                    'Sending...'
                  ) : cooldown > 0 ? (
                    `Resend email in ${cooldown}s`
                  ) : (
                    'Resend Reset Email'
                  )}
                </Button>

                <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  <Link to="/login">Back to Sign In</Link>
                </Button>
              </div>
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
