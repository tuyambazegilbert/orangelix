import { Link } from 'react-router-dom';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { AlertTriangle, FileText, Youtube, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <SEOHead
        title="Disclaimer & DMCA Policy — OrangeFlix"
        description="Review the OrangeFlix Fair Use notice, third-party YouTube media disclaimer, and copyright DMCA takedown procedures."
        url="https://orangeflixx.vercel.app/disclaimer"
      />

      <div className="page-wrap py-8 space-y-10 max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Home', url: '/' },
            { name: 'Disclaimer & DMCA', url: '/disclaimer' },
          ]}
        />

        {/* Header */}
        <div className="space-y-3 border-b border-white/[.08] pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Fair Use & Copyright Notice</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Disclaimer & DMCA Policy</h1>
          <p className="text-xs text-slate-400">Published: August 2026</p>
        </div>

        <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
          {/* No Video Hosting Section */}
          <section className="p-6 rounded-3xl bg-gray-900/60 border border-amber-500/20 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              1. Non-Hosting & Third-Party Media Disclaimer
            </h2>
            <p>
              <strong>OrangeFlix does not host, upload, or store any video media files on its servers.</strong>
            </p>
            <p className="text-xs text-slate-300">
              All cinema content, movies, series episodes, and trailers presented on OrangeFlix are embedded directly from third-party hosting providers (predominantly official YouTube creators, film studio accounts, and public broadcasters) using standard, publicly available YouTube Iframe embed players.
            </p>
            <p className="text-xs text-slate-300">
              Content availability, monetization, advertisements (if any), and playback restrictions are controlled entirely by the original channel owners and YouTube.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-400" />
              2. Fair Use & Cultural Promotion
            </h2>
            <p>
              OrangeFlix was developed by <strong>Gilbert Tuyambaze</strong> as a cultural preservation, educational, and indexing portal celebrating African cinema (Rwanda, Uganda, Kenya, Nigeria, Ghana, Tanzania, South Africa) alongside world cinema.
            </p>
            <p className="text-xs text-slate-300">
              All promotional poster artwork, movie descriptions, and metadata are indexed for informational, review, and discovery purposes under Fair Use principles (17 U.S.C. § 107).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-400" />
              3. DMCA & Content Takedown Requests
            </h2>
            <p>
              We deeply respect intellectual property rights. If you are a copyright owner or an authorized agent and believe that content indexed on OrangeFlix infringes upon your copyright, please submit a formal takedown request containing:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 ml-2">
              <li>Identification of the copyrighted work claimed to be infringed.</li>
              <li>The exact OrangeFlix URL or YouTube Video ID of the material to be removed from our index.</li>
              <li>Your contact information (full name, email, phone number, and physical address).</li>
              <li>A statement that you have a good faith belief that the use of the material is not authorized by the copyright owner.</li>
              <li>A statement made under penalty of perjury that the information in your notification is accurate.</li>
            </ul>
          </section>

          <section className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-950 border border-white/[.08] space-y-3">
            <h3 className="text-base font-bold text-white">Direct DMCA Contact</h3>
            <p className="text-xs text-slate-300">
              Send your takedown notices directly to our designated copyright contact. We process all valid requests promptly within 24 to 48 hours:
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-9 px-4 rounded-xl">
                <a href="mailto:tuyambazegilbert05@gmail.com?subject=DMCA%20Takedown%20Notice%20-%20OrangeFlix">
                  <Mail className="w-3.5 h-3.5 mr-1.5" /> Submit DMCA Notice
                </a>
              </Button>
              <Button asChild variant="outline" className="border-white/10 text-slate-300 text-xs h-9 px-4 rounded-xl">
                <Link to="/story-behind">Meet the Founder <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

