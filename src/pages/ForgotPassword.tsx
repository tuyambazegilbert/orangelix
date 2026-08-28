import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseEnabled } from '@/lib/firebase';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); setSending(true); const sent = await resetPassword(email); setSending(false); if (sent) toast.success('Password reset email sent.'); else toast.error(firebaseEnabled ? 'Unable to send reset email. Check the address and try again.' : 'Configure Firebase Auth to enable password resets.'); };
  return <main className="page-wrap flex min-h-[70vh] items-center justify-center"><section className="glass w-full max-w-md rounded-2xl p-6 sm:p-8"><Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-orange-400"><ArrowLeft className="h-3.5 w-3.5" />Back to sign in</Link><div className="mt-7"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-400/10 text-orange-400"><Mail className="h-5 w-5" /></span><h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Reset your password</h1><p className="mt-2 text-sm leading-6 text-slate-400">Enter your email and we’ll send a secure reset link.</p></div><form onSubmit={submit} className="mt-6"><label className="text-sm font-medium text-slate-200">Email address<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 h-11 w-full rounded-lg border border-white/[.1] bg-black/15 px-3 text-sm text-white outline-none focus:border-orange-400" /></label><button disabled={sending} className="premium-button mt-5 h-11 w-full rounded-lg text-sm font-semibold disabled:opacity-60">{sending ? 'Sending link...' : 'Send reset link'}</button></form></section></main>;
}
