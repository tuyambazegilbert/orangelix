import { Link } from 'react-router-dom';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Scale, FileCheck, AlertCircle, Sparkles, Mail } from 'lucide-react';

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <SEOHead
        title="Terms & Conditions — OrangeFlix"
        description="Review the Terms of Service and Conditions of Use governing the OrangeFlix cinema discovery and streaming platform."
        url="https://orangeflixx.vercel.app/terms"
      />

      <div className="page-wrap py-8 space-y-10 max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Home', url: '/' },
            { name: 'Terms & Conditions', url: '/terms' },
          ]}
        />

        {/* Header */}
        <div className="space-y-3 border-b border-white/[.08] pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Terms & Conditions</h1>
          <p className="text-xs text-slate-400">Effective Date: August 2026</p>
        </div>

        <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-orange-400" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using OrangeFlix (the "Service"), you agree to be bound by these Terms & Conditions. If you disagree with any part of these terms, you may not use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400" />
              2. Platform Purpose & Non-Commercial Indexing
            </h2>
            <p>
              OrangeFlix is an educational, cultural curation, and discovery index created to celebrate African and global cinematic arts. OrangeFlix acts solely as an aggregator and discovery interface that links to public, creator-uploaded content hosted on YouTube and metadata supplied by TMDB.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-orange-400" />
              3. Intellectual Property Rights
            </h2>
            <p>
              All video content, titles, trademarks, and cover artworks displayed on OrangeFlix belong to their respective copyright holders, filmmakers, and production studios. OrangeFlix claims no ownership over any embedded media streams.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              4. User Conduct & Prohibited Activities
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 ml-2">
              <li>Attempt to scrape, reverse engineer, or exploit platform discovery endpoints maliciously.</li>
              <li>Post defamatory, abusive, or infringing comments or reviews on public titles.</li>
              <li>Bypass or manipulate authentication, ratings, or local security policies.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-orange-400" />
              5. Disclaimer of Warranties & Limitation of Liability
            </h2>
            <p>
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind. OrangeFlix and creator Gilbert Tuyambaze shall not be liable for any indirect, incidental, or consequential damages resulting from platform use.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-gray-900/60 border border-white/[.08] space-y-2">
            <h3 className="text-base font-bold text-white">Contact & Inquiries</h3>
            <p className="text-xs text-slate-300">
              If you have any questions or legal inquiries concerning these Terms & Conditions, please contact us at:
            </p>
            <p className="text-xs text-orange-400 font-semibold flex items-center gap-1.5 pt-1">
              <Mail className="w-4 h-4" /> tuyambazegilbert05@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

