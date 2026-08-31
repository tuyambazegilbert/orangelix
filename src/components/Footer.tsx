import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ExternalLink, Film, Heart, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const FooterLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link to={to} className="text-xs text-slate-400 transition hover:text-orange-300">
    {children}
  </Link>
);

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSubscribed(true);
    toast.success('Subscribed to OrangeFlix Updates!', {
      description: `We'll send weekly cinema highlights and premieres to ${email}`,
    });
    setEmail('');
  };

  return (
    <footer className="relative overflow-hidden border-t border-white/[.07] bg-[#080d17] pb-20 pt-12 lg:pb-8">
      <div className="pointer-events-none absolute -top-32 right-[12%] h-64 w-64 rounded-full bg-orange-500/[.07] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-[10%] h-56 w-56 rounded-full bg-violet-600/[.08] blur-3xl" />

      <div className="relative mx-auto grid max-w-[1600px] gap-8 px-5 sm:grid-cols-2 lg:grid-cols-6 lg:px-[clamp(2rem,5vw,6rem)]">
        {/* Col 1: Brand */}
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/android-chrome-192x192.png"
              alt="OrangeFlix logo"
              className="h-9 w-9 object-contain drop-shadow-[0_2px_8px_rgba(249,115,22,0.4)]"
            />
            <span className="text-xl font-bold tracking-tight text-white">
              Orange<span className="text-orange-400">Flix</span>
            </span>
          </Link>
          <p className="mt-3 max-w-sm text-xs leading-5 text-slate-400">
            African & global cinema discovery, full movie & series streaming, soundtrack albums, and AI-powered recommendations.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              to="/story-behind"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-semibold hover:bg-orange-500/20 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>The Story Behind</span>
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Film className="h-4 w-4 text-orange-400" />
              Built for cinema lovers
            </div>
          </div>
        </div>

        {/* Col 2: Catalog */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">Browse</h2>
          <nav className="mt-3 grid gap-2">
            <FooterLink to="/movies">Movies</FooterLink>
            <FooterLink to="/series">TV Shows</FooterLink>
            <FooterLink to="/trending">Trending Now</FooterLink>
            <FooterLink to="/new">New Releases</FooterLink>
            <FooterLink to="/genres">Genre Guide</FooterLink>
          </nav>
        </div>

        {/* Col 3: Discovery Hubs */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">Discovery</h2>
          <nav className="mt-3 grid gap-2">
            <FooterLink to="/movie-night">Tonight & Mood</FooterLink>
            <FooterLink to="/news">Cinema News</FooterLink>
            <FooterLink to="/music">Soundtracks</FooterLink>
            <FooterLink to="/books">Book Adaptations</FooterLink>
          </nav>
        </div>

        {/* Col 4: Trust & Legal */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">Trust & Legal</h2>
          <nav className="mt-3 grid gap-2">
            <FooterLink to="/story-behind">Story Behind & Founder</FooterLink>
            <FooterLink to="/security">Security & Architecture</FooterLink>
            <FooterLink to="/privacy">Privacy Policy</FooterLink>
            <FooterLink to="/terms">Terms & Conditions</FooterLink>
            <FooterLink to="/disclaimer">Disclaimer & DMCA</FooterLink>
            <FooterLink to="/support">Feedback & Bug Reports</FooterLink>
          </nav>
        </div>

        {/* Col 5: Newsletter */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">Stay in the Loop</h2>
          <p className="mt-3 text-xs leading-5 text-slate-400">
            One thoughtful note when something worth watching arrives.
          </p>
          {isSubscribed ? (
            <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>You&apos;re subscribed to OrangeFlix premieres!</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="mt-3 flex h-9 rounded-lg border border-white/[.1] bg-white/[.035] p-1">
              <label className="grid w-7 place-items-center text-slate-500" aria-label="Email address">
                <Mail className="h-3.5 w-3.5" />
              </label>
              <input
                className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="rounded-md bg-orange-500 px-3 text-xs font-semibold text-white transition hover:bg-orange-400 shadow-sm"
              >
                Join
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="relative mx-auto mt-8 flex max-w-[1600px] flex-col gap-4 border-t border-white/[.07] px-5 pt-4 text-xs text-slate-500 lg:flex-row lg:items-center lg:justify-between lg:px-[clamp(2rem,5vw,6rem)]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span>© {new Date().getFullYear()} OrangeFlix</span>
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <span className="inline-flex items-center gap-1.5">
            Crafted with <Heart className="h-3 w-3 fill-orange-400 text-orange-400" /> for film lovers
          </span>
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <Link to="/security" className="hover:text-orange-400 transition">Security</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-orange-400 transition">Privacy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-orange-400 transition">Terms</Link>
            <span>•</span>
            <Link to="/disclaimer" className="hover:text-orange-400 transition">Disclaimer</Link>
            <span>•</span>
            <Link to="/story-behind" className="hover:text-orange-400 transition">Founder Story</Link>
            <span>•</span>
            <Link to="/support" className="hover:text-orange-400 transition">Support</Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/story-behind"
            className="inline-flex items-center gap-1.5 font-medium text-slate-300 transition hover:text-orange-300"
          >
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            Honored creation by Gilbert Tuyambaze
          </Link>
          <a
            href="https://tuyambaze-gilbert.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-orange-400/90 hover:text-orange-300 font-semibold"
          >
            Portfolio <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-1.5 hover:text-orange-300 ml-auto lg:ml-0"
          >
            Back to top <ArrowUp className="h-3 w-3" />
          </button>
        </div>
      </div>
    </footer>
  );
}
