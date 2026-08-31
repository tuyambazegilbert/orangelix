import { Link } from 'react-router-dom';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Shield, Lock, Eye, FileText, CheckCircle2, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <SEOHead
        title="Privacy Policy — OrangeFlix"
        description="Read the OrangeFlix Privacy Policy to understand how your data, favorites, and streaming preferences are handled with strict privacy safeguards."
        url="https://orangeflixx.vercel.app/privacy"
      />

      <div className="page-wrap py-8 space-y-10 max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Home', url: '/' },
            { name: 'Privacy Policy', url: '/privacy' },
          ]}
        />

        {/* Header */}
        <div className="space-y-3 border-b border-white/[.08] pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Transparency & User Rights</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Privacy Policy</h1>
          <p className="text-xs text-slate-400">Last updated: August 2026</p>
        </div>

        <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-400" />
              1. Information We Collect
            </h2>
            <p>
              OrangeFlix is designed to provide an ad-free, high-quality entertainment discovery catalog. We collect minimal data necessary to deliver platform features:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 ml-2">
              <li><strong>Account Credentials:</strong> Name and email address when you register an account.</li>
              <li><strong>User Preferences:</strong> Watchlist items, favorite movies, ratings, and custom movie reviews.</li>
              <li><strong>Viewing Progress:</strong> Playback timestamps stored locally in your browser to support resuming movies.</li>
              <li><strong>Technical Metadata:</strong> Non-identifying browser details to optimize 3D layout rendering and country territory matching.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-400" />
              2. How We Use Your Information
            </h2>
            <p>
              Your information is used strictly to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 ml-2">
              <li>Synchronize your watchlist, favorites, and watch history across your devices.</li>
              <li>Provide personalized mood and genre recommendations via our recommendation algorithms.</li>
              <li>Deliver regional cinema discovery tailored to your selected territory (e.g. 🇷🇼 Rwanda, 🇺🇬 Uganda, 🇰🇪 Kenya, 🇳🇬 Nigeria).</li>
              <li>Protect against unauthorized account access and enforce platform security.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-400" />
              3. Third-Party Integrations & Embeds
            </h2>
            <p>
              OrangeFlix embeds media and leverages official APIs:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 ml-2">
              <li><strong>YouTube Embed API:</strong> Videos stream directly through YouTube’s official privacy-enhanced embed (`youtube-nocookie.com`). Interactions with the video player are governed by YouTube's Terms of Service and Google Privacy Policy.</li>
              <li><strong>TMDB API:</strong> Movie posters, cast details, and international release dates are sourced from The Movie Database (TMDB).</li>
              <li><strong>Firebase:</strong> Authentication tokens and cloud sync are securely hosted on Google Firebase cloud infrastructure.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-orange-400" />
              4. Your Rights & Data Deletion
            </h2>
            <p>
              You maintain full ownership of your data. At any time, you can:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 ml-2">
              <li>Export or view all saved watchlist and favorites data in your Profile.</li>
              <li>Clear local offline cache and viewing progress directly in your browser settings.</li>
              <li>Request complete account deletion and data erasure by contacting our privacy team.</li>
            </ul>
          </section>

          <section className="p-6 rounded-2xl bg-gray-900/60 border border-white/[.08] space-y-2">
            <h3 className="text-base font-bold text-white">Questions or Privacy Inquiries?</h3>
            <p className="text-xs text-slate-300">
              For any questions regarding this Privacy Policy or your data rights, please contact our founder and privacy officer:
            </p>
            <p className="text-xs text-orange-400 font-semibold flex items-center gap-1.5 pt-1">
              <Mail className="w-4 h-4" /> orangeflix.service@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

