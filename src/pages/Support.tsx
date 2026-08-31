import { FormEvent, KeyboardEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bug, Film, Lock, MessageSquare, Send, ShieldCheck, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { GeoContentService } from '@/services/geo-content-service';
import { GeoContentItem } from '@/types/geo-content';
import { POSTER_FALLBACK } from '@/lib/tmdb/images';
import { SupportMessage, SupportService, SupportThread, SupportThreadType, SupportVisibility } from '@/services/support-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const formatDate = (value: string) => value ? new Date(value).toLocaleString() : 'Just now';

export default function Support() {
  const { currentUser, isLoading } = useAuth();
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [selected, setSelected] = useState<SupportThread | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [type, setType] = useState<SupportThreadType>('feedback');
  const [visibility, setVisibility] = useState<SupportVisibility>('public');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [featured, setFeatured] = useState<GeoContentItem[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const loadThreads = async () => {
    if (!currentUser) return;
    try { setThreads(await SupportService.listThreads(currentUser.id)); } catch { toast.error('Could not load support conversations.'); }
  };
  const loadMessages = async (thread: SupportThread) => {
    setSelected(thread);
    try { setMessages(await SupportService.listMessages(thread.id)); } catch { toast.error('Could not load this conversation.'); }
  };
  useEffect(() => { void loadThreads(); }, [currentUser]);
  useEffect(() => {
    void GeoContentService.getMoviesByCountry({ countryCode: 'RW', limit: 5 }).then(({ items }) => {
      setFeatured(items
        .filter((item) => item.thumbnail)
        .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
        .slice(0, 5));
    }).catch(() => setFeatured([]));
  }, []);
  useEffect(() => {
    if (featured.length < 2) return;
    const timer = window.setInterval(() => setFeaturedIndex((index) => (index + 1) % featured.length), 5000);
    return () => window.clearInterval(timer);
  }, [featured.length]);

  const submitThread = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser || !subject.trim() || !body.trim()) return;
    setBusy(true);
    try {
      const id = await SupportService.createThread({ type, subject: subject.trim(), body: body.trim(), visibility, ownerId: currentUser.id, ownerName: currentUser.name || 'OrangeFlix Member', ownerEmail: currentUser.email });
      setSubject(''); setBody('');
      await loadThreads();
      toast.success('Your message was sent.');
      const created = (await SupportService.listThreads(currentUser.id)).find((thread) => thread.id === id);
      if (created) await loadMessages(created);
    } catch { toast.error('Could not send your message.'); } finally { setBusy(false); }
  };

  const submitReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser || !selected || !reply.trim()) return;
    setBusy(true);
    try {
      await SupportService.addMessage(selected.id, { authorId: currentUser.id, authorName: currentUser.name || 'OrangeFlix Member', authorEmail: currentUser.email, body: reply.trim(), isAdmin: currentUser.isAdmin });
      setReply(''); await loadMessages(selected); await loadThreads();
    } catch { toast.error('Could not send your reply.'); } finally { setBusy(false); }
  };

  if (isLoading) return null;
  if (!currentUser) return <main className="mx-auto max-w-xl px-4 py-24"><Card className="border-orange-500/20 bg-gray-900"><CardContent className="p-8 text-center"><MessageSquare className="mx-auto mb-4 h-10 w-10 text-orange-400" /><h1 className="text-2xl font-bold text-white">Customer Support</h1><p className="mt-2 text-gray-400">Sign in to send feedback or report a bug.</p><Button asChild className="mt-6 bg-orange-500"><Link to="/login">Sign in</Link></Button></CardContent></Card></main>;

  const featuredItem = featured[featuredIndex];
  const featuredImage = featuredItem?.thumbnail || POSTER_FALLBACK;
  const stageItems = [
    featured[(featuredIndex + featured.length - 2) % Math.max(featured.length, 1)],
    featured[(featuredIndex + featured.length - 1) % Math.max(featured.length, 1)],
    featuredItem,
    featured[(featuredIndex + 1) % Math.max(featured.length, 1)],
    featured[(featuredIndex + 2) % Math.max(featured.length, 1)],
  ];
  const stageImage = (item: GeoContentItem | undefined) => item?.thumbnail || POSTER_FALLBACK;
  const geoWatchPath = (item: GeoContentItem | undefined) => item?.slug ? `/${(item.country || item.countryCode || 'RW').toLowerCase()}/watch/${item.slug}` : '/rw/movies';
  const openStageCard = (item: GeoContentItem | undefined) => { window.location.href = geoWatchPath(item); };
  const activateStageCard = (event: KeyboardEvent, item: GeoContentItem | undefined) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openStageCard(item); } };
  return <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6"><div className="mb-5 grid items-center gap-5 lg:grid-cols-[270px_1fr]"><div className="relative mx-auto h-32 w-64 [perspective:900px] lg:mx-0" aria-label="Featured geo cinema"><div onClick={() => openStageCard(stageItems[0])} onKeyDown={(event) => activateStageCard(event, stageItems[0])} role="link" tabIndex={0} className="absolute left-0 top-5 h-20 w-14 -rotate-[18deg] cursor-pointer overflow-hidden rounded-lg border border-white/15 bg-gray-900 shadow-xl"><img src={stageImage(stageItems[0])} alt={stageItems[0]?.title || 'Featured geo cinema'} className="h-full w-full object-cover opacity-55" /></div><div onClick={() => openStageCard(stageItems[1])} onKeyDown={(event) => activateStageCard(event, stageItems[1])} role="link" tabIndex={0} className="absolute left-7 top-3 h-24 w-16 -rotate-[10deg] cursor-pointer overflow-hidden rounded-lg border border-orange-400/40 bg-gray-900 shadow-2xl"><img src={stageImage(stageItems[1])} alt={stageItems[1]?.title || 'Featured geo cinema'} className="h-full w-full object-cover opacity-80" /></div><div onClick={() => openStageCard(stageItems[2])} onKeyDown={(event) => activateStageCard(event, stageItems[2])} role="link" tabIndex={0} className="absolute left-20 top-0 h-32 w-24 rotate-[2deg] cursor-pointer overflow-hidden rounded-lg border-2 border-orange-400 bg-gray-900 shadow-[0_16px_35px_rgba(249,115,22,.25)] transition-transform duration-700 hover:scale-105"><img src={stageImage(stageItems[2])} alt={stageItems[2]?.title || 'Featured geo cinema'} className="h-full w-full object-cover" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 px-2 pb-2 pt-8"><p className="truncate text-[10px] font-bold text-white">{stageItems[2]?.title || 'Geo cinema'}</p><p className="flex items-center gap-1 text-[9px] text-orange-300"><Star className="h-2.5 w-2.5 fill-current" />{stageItems[2]?.country || 'RW'} spotlight</p></div></div><div onClick={() => openStageCard(stageItems[3])} onKeyDown={(event) => activateStageCard(event, stageItems[3])} role="link" tabIndex={0} className="absolute left-36 top-3 h-24 w-16 rotate-[10deg] cursor-pointer overflow-hidden rounded-lg border border-orange-400/40 bg-gray-900 shadow-2xl"><img src={stageImage(stageItems[3])} alt={stageItems[3]?.title || 'Featured geo cinema'} className="h-full w-full object-cover opacity-80" /></div><div onClick={() => openStageCard(stageItems[4])} onKeyDown={(event) => activateStageCard(event, stageItems[4])} role="link" tabIndex={0} className="absolute left-44 top-5 h-20 w-14 rotate-[18deg] cursor-pointer overflow-hidden rounded-lg border border-white/15 bg-gray-900 shadow-xl"><img src={stageImage(stageItems[4])} alt={stageItems[4]?.title || 'Featured geo cinema'} className="h-full w-full object-cover opacity-55" /></div><Film className="absolute bottom-0 right-0 h-5 w-5 text-orange-400" /></div><div><p className="text-xs font-semibold uppercase tracking-widest text-orange-400">OrangeFlix Support</p><h1 className="mt-1 text-2xl font-black text-white">Feedback & bug reports</h1><p className="mt-1 max-w-2xl text-sm text-gray-400">Start a conversation with the community or keep it private with customer service.</p></div></div><div className="grid items-start gap-4 lg:grid-cols-[340px_1fr]">
    <Card className="border-gray-800 bg-gray-900/80"><CardHeader className="px-5 py-4"><CardTitle className="text-lg text-white">New conversation</CardTitle></CardHeader><CardContent className="px-5 pb-5 pt-0"><form onSubmit={submitThread} className="space-y-3"><div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" onClick={() => setType('feedback')} className={`h-9 text-xs ${type === 'feedback' ? 'border-orange-500 text-orange-300' : 'border-gray-700 text-gray-300'}`}><MessageSquare className="mr-1.5 h-3.5 w-3.5" />Feedback</Button><Button type="button" variant="outline" onClick={() => setType('bug')} className={`h-9 text-xs ${type === 'bug' ? 'border-rose-500 text-rose-300' : 'border-gray-700 text-gray-300'}`}><Bug className="mr-1.5 h-3.5 w-3.5" />Bug</Button></div><div><Label className="text-xs text-gray-300">Subject</Label><Input value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1.5 h-9 border-gray-700 bg-gray-950 text-sm text-white" required /></div><div><Label className="text-xs text-gray-300">Message</Label><Textarea value={body} onChange={(event) => setBody(event.target.value)} className="mt-1.5 min-h-24 border-gray-700 bg-gray-950 text-sm text-white" required /></div><div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" onClick={() => setVisibility('public')} className={`h-9 text-xs ${visibility === 'public' ? 'border-emerald-500 text-emerald-300' : 'border-gray-700 text-gray-300'}`}><ShieldCheck className="mr-1.5 h-3.5 w-3.5" />Public</Button><Button type="button" variant="outline" onClick={() => setVisibility('private')} className={`h-9 text-xs ${visibility === 'private' ? 'border-orange-500 text-orange-300' : 'border-gray-700 text-gray-300'}`}><Lock className="mr-1.5 h-3.5 w-3.5" />Private</Button></div><Button disabled={busy} className="h-9 w-full bg-orange-500 text-xs hover:bg-orange-400"><Send className="mr-1.5 h-3.5 w-3.5" />Send message</Button></form></CardContent></Card>
    <Card className="h-fit border-gray-800 bg-gray-900/80"><CardHeader className="px-5 py-4"><CardTitle className="text-lg text-white">Community conversations</CardTitle></CardHeader><CardContent className="space-y-3 px-5 pb-5 pt-0">{threads.length === 0 ? <div className="flex min-h-16 items-center gap-2 text-sm text-gray-500"><MessageSquare className="h-4 w-4" />No conversations yet.</div> : threads.map((thread) => <button key={thread.id} onClick={() => void loadMessages(thread)} className={`w-full border-l-2 p-3 text-left transition ${selected?.id === thread.id ? 'border-orange-400 bg-orange-500/10' : 'border-gray-700 bg-gray-950/40 hover:border-orange-500/60'}`}><div className="flex items-center justify-between gap-3"><span className="truncate text-sm font-semibold text-white">{thread.subject}</span><span className="text-[10px] uppercase text-orange-300">{thread.status.replace('_', ' ')}</span></div><p className="mt-1 line-clamp-2 text-xs text-gray-400">{thread.body}</p><p className="mt-1.5 text-[11px] text-gray-600">{thread.ownerName} · {formatDate(thread.updatedAt)}</p></button>)}</CardContent></Card>
  </div>{selected && <Card className="mt-4 border-orange-500/20 bg-gray-900/80"><CardHeader className="px-5 py-4"><CardTitle className="flex items-center gap-2 text-lg text-white"><MessageSquare className="h-4 w-4 text-orange-400" />{selected.subject}</CardTitle></CardHeader><CardContent className="px-5 pb-5 pt-0"><div className="space-y-3">{messages.map((message) => <div key={message.id} className={`border-l-2 p-3 ${message.isAdmin ? 'border-emerald-400 bg-emerald-500/5' : 'border-orange-400 bg-gray-950/50'}`}><div className="flex justify-between gap-3 text-xs"><strong className="text-white">{message.authorName}{message.isAdmin ? ' · Support' : ''}</strong><span className="text-gray-500">{formatDate(message.createdAt)}</span></div><p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-gray-300">{message.body}</p></div>)}</div><form onSubmit={submitReply} className="mt-4 flex gap-2"><Textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply to this conversation" className="min-h-16 border-gray-700 bg-gray-950 text-sm text-white" required /><Button disabled={busy} className="h-9 self-end bg-orange-500"><Send className="h-4 w-4" /></Button></form></CardContent></Card>}</main>;
}
