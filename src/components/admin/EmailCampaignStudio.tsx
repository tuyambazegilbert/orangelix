import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Mail, Send, Users, Sparkles } from 'lucide-react';
import { User } from '@/types';
import { EmailService, CampaignEmailKind } from '@/services/email-service';
import { FirebaseData } from '@/lib/firebase-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

type RecipientMode = 'manual' | 'selected' | 'all';

const templates: Array<{ kind: CampaignEmailKind; label: string; description: string; subject: string }> = [
  { kind: 'welcome', label: 'Welcome', description: 'Account creation and onboarding', subject: 'Welcome to OrangeFlix' },
  { kind: 'invitation', label: 'Invitation', description: 'Invite a new member to join', subject: 'You are invited to OrangeFlix' },
  { kind: 'announcement', label: 'Announcement', description: 'New releases, offers, and platform news', subject: 'New on OrangeFlix' },
  { kind: 'retention', label: 'Re-engagement', description: 'Bring members back to continue watching', subject: 'Your OrangeFlix watchlist misses you' },
  { kind: 'security', label: 'Security', description: 'Account and trust communications', subject: 'OrangeFlix account security update' },
];

export default function EmailCampaignStudio({ users, actorEmail, onSent }: { users: User[]; actorEmail?: string; onSent?: () => void }) {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<CampaignEmailKind>('welcome');
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('manual');
  const [manualEmail, setManualEmail] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState(templates[0].subject);
  const [message, setMessage] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [isSending, setIsSending] = useState(false);

  const activeTemplate = templates.find((item) => item.kind === kind)!;
  const recipients = useMemo(() => {
    if (recipientMode === 'manual') return manualEmail.trim() ? [{ email: manualEmail.trim(), name: manualEmail.trim().split('@')[0] }] : [];
    if (recipientMode === 'all') return users.filter((user) => user.email);
    return users.filter((user) => selectedIds.has(user.id) && user.email);
  }, [manualEmail, recipientMode, selectedIds, users]);

  const chooseTemplate = (nextKind: CampaignEmailKind) => {
    setKind(nextKind);
    setSubject(templates.find((item) => item.kind === nextKind)!.subject);
  };
  const toggleUser = (id: string) => setSelectedIds((previous) => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const send = async () => {
    if (!recipients.length || recipients.some((recipient) => !recipient.email.includes('@'))) return toast.error('Choose at least one valid recipient.');
    setIsSending(true);
    try {
      const results = await Promise.allSettled(recipients.map((recipient) => EmailService.sendCampaignEmail({
        email: recipient.email, name: recipient.name, kind, subject, message, actionLabel, actionUrl,
      })));
      const sent = results.filter((result) => result.status === 'fulfilled' && result.value).length;
      await FirebaseData.logActivity('EMAIL_CAMPAIGN_SENT', `${activeTemplate.label} campaign sent to ${sent}/${recipients.length} recipient(s)`, actorEmail);
      toast.success(`${activeTemplate.label} campaign sent to ${sent} recipient${sent === 1 ? '' : 's'}.`);
      onSent?.();
      setStep(0);
    } catch {
      toast.error('The campaign could not be sent. Check your Brevo configuration.');
    } finally { setIsSending(false); }
  };

  const next = () => {
    if (step === 1 && !recipients.length) return toast.error('Choose at least one recipient first.');
    setStep((current) => Math.min(3, current + 1));
  };

  return <div className="email-campaign-compact space-y-3 animate-in fade-in duration-500">
    <div className="rounded-2xl border border-orange-500/25 bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,.2),transparent_40%),linear-gradient(135deg,#111827,#070b14)] p-3 sm:p-4 shadow-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-orange-400">OrangeFlix Communications</p><h2 className="mt-1 text-lg font-black text-white">Campaign Studio</h2><p className="mt-0.5 text-xs text-slate-400">Build, review, and dispatch messages.</p></div>
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/20 px-2.5 py-2 text-[10px] text-slate-300"><Sparkles className="h-3 w-3 text-orange-400" /> Branded templates · controlled delivery</div>
      </div>
    </div>

    <div className="grid grid-cols-4 gap-1.5">{['Template', 'Audience', 'Preview', 'Send'].map((label, index) => <button key={label} onClick={() => index <= step && setStep(index)} className={`rounded-lg border px-1 py-2 text-[10px] font-bold transition ${step === index ? 'border-orange-400 bg-orange-500 text-white shadow-lg shadow-orange-900/30' : index < step ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-gray-800 bg-gray-900 text-gray-500'}`}>{index < step ? <Check className="mx-auto h-3 w-3" /> : `${index + 1}. ${label}`}</button>)}</div>

    <div className="min-h-[260px] [perspective:1200px]">
      <Card className="h-full border-gray-800 bg-gray-900/80 shadow-2xl transition-transform duration-500 [transform-style:preserve-3d]" style={{ transform: `rotateY(${step % 2 ? '-1.5deg' : '1.5deg'}) rotateX(.5deg)` }}>
        {step === 0 && <><CardHeader className="p-3 pb-1"><CardTitle className="text-base text-white">Choose a message template</CardTitle><CardDescription className="text-[11px]">OrangeFlix identity, support email, and responsive design.</CardDescription></CardHeader><CardContent className="grid gap-2 p-3 pt-2 sm:grid-cols-2 lg:grid-cols-3">{templates.map((template) => <button key={template.kind} onClick={() => chooseTemplate(template.kind)} className={`rounded-xl border p-3 text-left transition hover:-translate-y-0.5 ${kind === template.kind ? 'border-orange-400 bg-orange-500/10 ring-1 ring-orange-400' : 'border-gray-800 bg-gray-950 hover:border-gray-600'}`}><Mail className="mb-2 h-4 w-4 text-orange-400" /><p className="text-sm font-bold text-white">{template.label}</p><p className="mt-0.5 text-[11px] leading-snug text-gray-400">{template.description}</p></button>)}</CardContent></>}
        {step === 1 && <><CardHeader><CardTitle className="text-white">Choose your audience</CardTitle><CardDescription>Send to one address, selected platform members, or all eligible users.</CardDescription></CardHeader><CardContent className="space-y-5"><Select value={recipientMode} onValueChange={(value) => setRecipientMode(value as RecipientMode)}><SelectTrigger className="border-gray-700 bg-gray-950 text-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual">Enter one email address</SelectItem><SelectItem value="selected">Select platform users</SelectItem><SelectItem value="all">All platform users ({users.length})</SelectItem></SelectContent></Select>{recipientMode === 'manual' ? <Input value={manualEmail} onChange={(event) => setManualEmail(event.target.value)} className="border-gray-700 bg-gray-950 text-white" placeholder="member@example.com" type="email" /> : recipientMode === 'selected' ? <div className="max-h-52 space-y-2 overflow-auto rounded-xl border border-gray-800 p-3">{users.map((user) => <label key={user.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-white/5"><Checkbox checked={selectedIds.has(user.id)} onCheckedChange={() => toggleUser(user.id)} /><span className="min-w-0"><span className="block truncate text-sm text-white">{user.name || user.email}</span><span className="block truncate text-xs text-gray-400">{user.email}</span></span></label>)}</div> : <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-sm text-orange-100"><Users className="mr-2 inline h-4 w-4" />{users.length} members will receive this message.</div>}<p className="text-xs text-gray-400">Recipients selected: <strong className="text-white">{recipients.length}</strong></p></CardContent></>}
        {step === 2 && <><CardHeader><CardTitle className="text-white">Craft and preview</CardTitle><CardDescription>Optional copy replaces the template body. Keep security and legal messages factual.</CardDescription></CardHeader><CardContent className="grid gap-6 lg:grid-cols-2"><div className="space-y-4"><div><Label className="text-gray-300">Subject</Label><Input value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-2 border-gray-700 bg-gray-950 text-white" /></div><div><Label className="text-gray-300">Message</Label><Textarea value={message} onChange={(event) => setMessage(event.target.value)} className="mt-2 min-h-28 border-gray-700 bg-gray-950 text-white" placeholder="Leave blank to use the polished OrangeFlix template copy." /></div><div className="grid gap-3 sm:grid-cols-2"><Input value={actionLabel} onChange={(event) => setActionLabel(event.target.value)} className="border-gray-700 bg-gray-950 text-white" placeholder="Button label (optional)" /><Input value={actionUrl} onChange={(event) => setActionUrl(event.target.value)} className="border-gray-700 bg-gray-950 text-white" placeholder="Button link (optional)" /></div></div><div className="rounded-2xl border border-orange-500/30 bg-[#070b14] p-6 shadow-inner"><p className="text-center text-xl font-black text-white">Orange<span className="text-orange-500">Flix</span></p><p className="mx-auto mt-3 w-fit rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-300">{activeTemplate.label}</p><h3 className="mt-7 text-center text-lg font-bold text-white">{subject || activeTemplate.subject}</h3><p className="mt-4 text-sm leading-relaxed text-slate-300">Hello member,</p><p className="mt-3 text-sm leading-relaxed text-slate-400">{message || activeTemplate.description}</p><div className="mt-6 text-center"><span className="inline-block rounded-xl bg-orange-500 px-5 py-3 text-xs font-bold text-white">{actionLabel || 'Explore OrangeFlix'}</span></div><p className="mt-7 text-center text-[10px] text-slate-500">orangeflix.service@gmail.com · Kigali, Rwanda</p></div></CardContent></>}
        {step === 3 && <><CardHeader><CardTitle className="text-white">Ready to send</CardTitle><CardDescription>Review the delivery summary. Emails are recorded in the platform audit log.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-gray-950 p-4"><p className="text-xs text-gray-500">Template</p><p className="mt-1 font-bold text-white">{activeTemplate.label}</p></div><div className="rounded-xl bg-gray-950 p-4"><p className="text-xs text-gray-500">Recipients</p><p className="mt-1 font-bold text-white">{recipients.length}</p></div><div className="rounded-xl bg-gray-950 p-4"><p className="text-xs text-gray-500">Subject</p><p className="mt-1 truncate font-bold text-white">{subject}</p></div></div><div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-relaxed text-amber-100">Use a server-side email relay in production. A browser `VITE_BREVO_API_KEY` is visible to visitors and is only suitable for development.</div></CardContent></>}
      </Card>
    </div>
    <div className="flex items-center justify-between"><Button variant="outline" disabled={step === 0 || isSending} onClick={() => setStep((current) => current - 1)} className="border-gray-700 text-gray-300"><ChevronLeft className="mr-1 h-4 w-4" /> Back</Button>{step < 3 ? <Button onClick={next} className="bg-orange-500 hover:bg-orange-600">Next <ChevronRight className="ml-1 h-4 w-4" /></Button> : <Button disabled={isSending || !recipients.length} onClick={send} className="bg-orange-500 hover:bg-orange-600">{isSending ? 'Sending…' : 'Send campaign'} <Send className="ml-1 h-4 w-4" /></Button>}</div>
  </div>;
}
