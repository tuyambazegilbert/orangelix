import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sparkles,
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  Mail,
  Phone,
  MapPin,
  Code2,
  Film,
  Heart,
  Globe,
  Flame,
  Award,
  Layers,
  CheckCircle2,
  Monitor,
  Cpu,
  RefreshCw,
} from 'lucide-react';

const FOUNDER_INFO = {
  name: 'Gilbert Tuyambaze',
  title: 'Full-Stack Web Developer & Web Designer',
  fellowship: 'A2SV Software Engineering Fellow',
  location: 'Kigali, Rwanda',
  email: 'tuyambazegilbert05@gmail.com',
  phone: '+250793438873',
  portfolioUrl: 'https://tuyambaze-gilbert.vercel.app/',
  githubUrl: 'https://github.com/GILBERT-Tuyambaze/',
  linkedinUrl: 'https://www.linkedin.com/in/gilbert-tuyambaze-02044a3bb/',
  twitterUrl: 'https://twitter.com/Gilbert_01_TZ',
  facebookUrl: 'https://facebook.com/profile.php?id=10008431944042',
  images: {
    avatarLight: 'https://tuyambaze-gilbert.vercel.app/images/gilbert-tuyambaze-light.jpeg',
    avatarDark: 'https://tuyambaze-gilbert.vercel.app/images/gilbert-tuyambaze-dark.jpeg',
    preview: 'https://tuyambaze-gilbert.vercel.app/images/Screenshot-light.png',
  },
  skills: [
    'Frontend Engineering',
    'Full-Stack Architecture',
    'React & TypeScript',
    'Tailwind CSS',
    'UI/UX Design',
    'Video Streaming & YouTube Discovery',
    'Performance Optimization',
    'Creative Technologist',
    'A2SV Algorithm Engineering',
    'Music Production',
  ],
};

export default function StoryBehind() {
  const [iframeKey, setIframeKey] = useState(0);

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <SEOHead
        title="The Story Behind OrangeFlix — Built by Gilbert Tuyambaze | Kigali, Rwanda"
        description="Discover the story and legacy behind OrangeFlix, a cinema platform built by Kigali-based full-stack developer Gilbert Tuyambaze to unify African and global cinema storytelling."
        keywords="Gilbert Tuyambaze, Tuyambaze Gilbert, Kigali Rwanda web developer, African cinema streaming, OrangeFlix founder, A2SV software engineering fellow, React developer Rwanda, Kigali UI UX designer"
        url="https://orangeflixx.vercel.app/story-behind"
      />

      <div className="page-wrap py-8 space-y-12">
        <Breadcrumbs
          items={[
            { name: 'Home', url: '/' },
            { name: 'The Story Behind', url: '/story-behind' },
          ]}
        />

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[.1] bg-[radial-gradient(ellipse_at_80%_20%,rgba(249,115,22,0.18),transparent_50%),linear-gradient(135deg,#0d1527_0%,#090d18_60%,#181028_100%)] p-6 sm:p-10 lg:p-14 shadow-2xl">
          <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Founder & Creator Story</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Crafting the Future of <span className="text-orange-400">African & Global</span> Cinema Discovery.
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                OrangeFlix is an honored creation engineered by{' '}
                <strong className="text-white font-semibold">Gilbert Tuyambaze</strong>, a Kigali-based full-stack software engineer and A2SV fellow. Born out of a deep passion to bridge continental storytelling with modern streaming engineering.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  asChild
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-lg shadow-orange-500/20"
                >
                  <a href={FOUNDER_INFO.portfolioUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-4 h-4 mr-1.5" /> Explore Gilbert's Live Portfolio
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="border-white/15 bg-white/[.04] hover:bg-white/[.08] text-white text-xs h-10 px-4 rounded-xl"
                >
                  <a href={FOUNDER_INFO.githubUrl} target="_blank" rel="noreferrer">
                    <Github className="w-4 h-4 mr-1.5" /> GitHub Profile
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="border-white/15 bg-white/[.04] hover:bg-white/[.08] text-white text-xs h-10 px-4 rounded-xl"
                >
                  <a href={FOUNDER_INFO.linkedinUrl} target="_blank" rel="noreferrer">
                    <Linkedin className="w-4 h-4 mr-1.5 text-sky-400" /> LinkedIn
                  </a>
                </Button>
              </div>
            </div>

            {/* Founder Profile Card */}
            <div className="relative group">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-orange-500 to-violet-600 opacity-30 blur-xl group-hover:opacity-50 transition duration-500" />
              <Card className="relative bg-[#0c1222] border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="aspect-[4/3] w-full overflow-hidden bg-gray-950 relative">
                  <img
                    src={FOUNDER_INFO.images.avatarDark}
                    alt={FOUNDER_INFO.name}
                    className="w-full h-full object-cover object-top transition duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FOUNDER_INFO.images.avatarLight;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c1222] via-transparent to-transparent" />
                  <Badge className="absolute bottom-3 left-3 bg-orange-500 text-white text-[10px] font-bold">
                    🇷🇼 Kigali, Rwanda
                  </Badge>
                </div>
                <CardContent className="p-5 space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{FOUNDER_INFO.name}</h3>
                    <p className="text-xs text-orange-400 font-medium">{FOUNDER_INFO.title}</p>
                    <p className="text-[11px] text-slate-400">{FOUNDER_INFO.fellowship}</p>
                  </div>

                  <div className="pt-2 border-t border-white/[.07] space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span>{FOUNDER_INFO.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <a href={`mailto:${FOUNDER_INFO.email}`} className="hover:text-white truncate">
                        {FOUNDER_INFO.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <a href={`tel:${FOUNDER_INFO.phone}`} className="hover:text-white">
                        {FOUNDER_INFO.phone}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Narrative & The Story Behind OrangeFlix */}
        <section className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-8 rounded-3xl bg-gray-900/40 border border-white/[.08] space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-400" />
                The Origin & Mission
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Cinema is humanity's most universal language. Yet for years, African cinema—from Rwanda's cinematic gems, Uganda's grassroots Wakaliwood action epics, Kenya's Riverwood narratives, to Nigeria's Nollywood blockbusters and South Africa's film scene—has been scattered across fragmented YouTube channels without a centralized, high-performance home.
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong className="text-white">OrangeFlix</strong> was engineered to solve this paradigm. Built from scratch with modern frontend architecture, intelligent rate-limited YouTube indexing, 10-minute multi-tier caching, mood-based AI recommendations, and full multi-country catalog support, OrangeFlix treats independent filmmakers with the same prestige as Hollywood premieres.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-gray-900/40 border border-white/[.08] space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Award className="w-6 h-6 text-orange-400" />
                Technical Pillars & Engineering Legacy
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-black/30 border border-white/[.06] space-y-2">
                  <div className="flex items-center gap-2 text-orange-400 text-xs font-bold">
                    <Code2 className="w-4 h-4" /> Real-Time Geo Pipeline
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Automated YouTube discovery engine that indexes, classifies, and curates multi-part series and full-length movies across 8+ countries.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/30 border border-white/[.06] space-y-2">
                  <div className="flex items-center gap-2 text-violet-400 text-xs font-bold">
                    <Cpu className="w-4 h-4" /> Multi-Tier Zero Latency
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    In-memory Map cache synced with localStorage & Firestore to guarantee 0ms instant catalog loading and resilient offline playback.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/30 border border-white/[.06] space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Globe className="w-4 h-4" /> 3D Staged Cinema UX
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Cinema-grade 3D card staging slider on desktop & mobile with dynamic ambient backdrops, skeleton placeholders, and fluid touch carousels.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/30 border border-white/[.06] space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                    <Monitor className="w-4 h-4" /> Multi-Entity Graph Engine
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Unified discovery linking movies to original soundtrack albums, Apple Music previews, behind-the-scenes news, and book adaptations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Core Skills & Expertise */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-gray-900/40 border border-white/[.08] space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-400" />
                Key Expertise & Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {FOUNDER_INFO.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="bg-white/[.03] border-white/10 text-xs text-slate-200 py-1 px-2.5 rounded-lg"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-orange-500/10 to-violet-600/10 border border-orange-500/20 space-y-4 text-center">
              <h3 className="text-base font-bold text-white">Have a Project or Collaboration?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Gilbert Tuyambaze is available for full-stack engineering, web design consulting, software partnerships, and creative technology ventures.
              </p>
              <Button
                asChild
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-10 rounded-xl"
              >
                <a href={`mailto:${FOUNDER_INFO.email}`}>
                  <Mail className="w-4 h-4 mr-2" /> Get in Touch
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Live Interactive Portfolio Embed */}
        <section className="space-y-4 pt-4 border-t border-white/[.08]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-orange-400 font-bold uppercase tracking-wider mb-1">
                <Globe className="w-3.5 h-3.5" /> Interactive Portfolio Showcase
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Explore Gilbert Tuyambaze's Live Portfolio
              </h2>
              <p className="text-xs text-slate-400">
                Direct live interactive frame of <a href={FOUNDER_INFO.portfolioUrl} target="_blank" rel="noreferrer" className="text-orange-400 hover:underline">tuyambaze-gilbert.vercel.app</a>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIframeKey((k) => k + 1)}
                className="border-white/15 bg-white/[.04] hover:bg-white/[.08] text-slate-200 text-xs h-8 rounded-lg"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reload
              </Button>
              <Button
                size="sm"
                variant="outline"
                asChild
                className="border-white/15 bg-white/[.04] hover:bg-white/[.08] text-slate-200 text-xs h-8 rounded-lg"
              >
                <a href={FOUNDER_INFO.portfolioUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open in New Tab
                </a>
              </Button>
            </div>
          </div>

          <div className="relative w-full rounded-3xl border border-white/[.12] overflow-hidden bg-gray-950 shadow-2xl">
            <div className="h-10 bg-gray-900/90 border-b border-white/[.08] px-4 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="font-mono text-[11px] text-slate-300 ml-2 hidden sm:inline">
                  https://tuyambaze-gilbert.vercel.app/
                </span>
              </div>
              <span className="text-[11px] text-orange-400 font-semibold">Live Preview</span>
            </div>

            <div className="relative w-full h-[650px] bg-slate-950">
              <iframe
                key={iframeKey}
                src={FOUNDER_INFO.portfolioUrl}
                title="Gilbert Tuyambaze Portfolio"
                className="w-full h-full border-0"
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

