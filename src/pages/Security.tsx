import { Link } from 'react-router-dom';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Lock,
  Key,
  Server,
  EyeOff,
  FileCheck,
  AlertTriangle,
  Mail,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function Security() {
  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <SEOHead
        title="Security & Platform Architecture — OrangeFlix"
        description="Learn how OrangeFlix safeguards your privacy, user credentials, offline storage, and streaming data through modern encryption and secure API design."
        keywords="OrangeFlix security, streaming platform security, data encryption, Firebase auth security, secure streaming"
        url="https://orangeflixx.vercel.app/security"
      />

      <div className="page-wrap py-8 space-y-10 max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Home', url: '/' },
            { name: 'Security & Trust', url: '/security' },
          ]}
        />

        {/* Hero Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Enterprise-Grade Security Standards</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Security & Data Protection
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
            At OrangeFlix, we prioritize the confidentiality, integrity, and availability of our users’ experience. Discover how our security architecture protects your accounts, watchlist data, and offline caching.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-gray-900/40 border border-white/[.08] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">HTTPS & TLS 1.3 Encryption</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              All communications between your browser and OrangeFlix servers are strictly encrypted in transit using industry-standard TLS 1.3 cryptographic protocols.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-900/40 border border-white/[.08] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Firebase Authentication</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Passwords and credentials are never stored in plaintext. Authentication tokens are securely verified with hardened Google Firebase OAuth standards.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-900/40 border border-white/[.08] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Zero Tracking Telemetry</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              We do not sell personal viewer history or install invasive third-party ad trackers. Your preferences and ratings remain strictly yours.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-900/40 border border-white/[.08] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Sanitized Database Queries</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              All Firestore documents and API requests are programmatically sanitized to prevent injection attacks and ensure strict schema compliance.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-900/40 border border-white/[.08] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">YouTube Iframe Sandboxing</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Official YouTube video players run within isolated, secure iframes with no-cookie domains (`youtube-nocookie.com`) for enhanced privacy.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-900/40 border border-white/[.08] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Local Cache Isolation</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Offline caching is isolated to the client domain and contains non-sensitive public cinema metadata to speed up discovery.
            </p>
          </div>
        </div>

        {/* Security Disclosures */}
        <section className="p-8 rounded-3xl bg-gradient-to-br from-gray-900/80 to-gray-950 border border-white/[.08] space-y-4">
          <h2 className="text-xl font-bold text-white">Responsible Vulnerability Disclosure</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            We welcome reports from security researchers and developers. If you discover a vulnerability or security flaw in OrangeFlix, please report it responsibly directly to our engineering lead:
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-9 px-4 rounded-xl">
              <a href="mailto:tuyambazegilbert05@gmail.com?subject=Security%20Vulnerability%20Report%20-%20OrangeFlix">
                <Mail className="w-3.5 h-3.5 mr-1.5" /> Report a Security Issue
              </a>
            </Button>
            <Button asChild variant="outline" className="border-white/10 text-slate-300 text-xs h-9 px-4 rounded-xl">
              <Link to="/privacy">View Privacy Policy →</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

