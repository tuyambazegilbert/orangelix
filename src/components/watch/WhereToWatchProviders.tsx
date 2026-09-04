import React, { useState } from 'react';
import { useWatchProviders } from '@/hooks/use-tmdb';
import { getCountryConfig } from '@/features/geo/countryConfig';
import { TMDBWatchProviderItem } from '@/types/tmdb';
import { Tv, PlayCircle, ShoppingBag, ExternalLink, Globe, Sparkles, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WhereToWatchProvidersProps {
  mediaType: 'movie' | 'tv';
  tmdbId: number | null | undefined;
  title: string;
  className?: string;
}

export const WhereToWatchProviders: React.FC<WhereToWatchProvidersProps> = ({
  mediaType,
  tmdbId,
  title,
  className = '',
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const { data: watchData, isLoading } = useWatchProviders(mediaType, tmdbId, selectedCountry || undefined);

  if (isLoading) {
    return (
      <div className={`rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4 animate-pulse ${className}`}>
        <div className="flex items-center justify-between">
          <div className="h-5 w-48 bg-white/10 rounded-lg" />
          <div className="h-8 w-28 bg-white/10 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl border border-white/[0.05]" />
          ))}
        </div>
      </div>
    );
  }

  const providers = watchData?.providers;
  const currentCountryCode = selectedCountry || watchData?.countryCode || 'US';
  const countryConfig = getCountryConfig(currentCountryCode);
  const allCountries = watchData?.allCountries || [];

  const flatrate = providers?.flatrate || [];
  const rent = providers?.rent || [];
  const buy = providers?.buy || [];
  const free = [...(providers?.free || []), ...(providers?.ads || [])];

  const hasAnyProvider = flatrate.length > 0 || rent.length > 0 || buy.length > 0 || free.length > 0;
  const justWatchLink = providers?.link || `https://www.justwatch.com/us/search?q=${encodeURIComponent(title)}`;

  return (
    <section className={`rounded-2xl border border-white/[0.08] bg-[#0c121e]/80 backdrop-blur-md p-4 sm:p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400">
              <Tv className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Where to Watch <span className="hidden sm:inline text-slate-400 font-normal text-sm">Full Movie & Show</span>
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Official streaming, rent & buy options verified via JustWatch
          </p>
        </div>

        {/* Region / Country Selector */}
        {allCountries.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Globe className="w-4 h-4 text-orange-400 shrink-0" />
            <div className="relative">
              <select
                value={currentCountryCode}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white cursor-pointer hover:border-orange-500/50 transition outline-none appearance-none pr-7"
              >
                {allCountries.map((cCode) => {
                  const conf = getCountryConfig(cCode);
                  return (
                    <option key={cCode} value={cCode} className="bg-gray-900 text-white">
                      {conf.flagEmoji || '🌐'} {conf.name} ({cCode})
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>
          </div>
        )}
      </div>

      {!hasAnyProvider ? (
        <div className="py-6 text-center space-y-3">
          <Film className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-white">
            No official stream providers listed for {countryConfig.name} ({currentCountryCode})
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try switching to another country in the dropdown or check JustWatch directly for digital and theatrical release details.
          </p>
          <div className="pt-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-xs"
            >
              <a href={justWatchLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Search on JustWatch
              </a>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* 1. Subscription Streaming (Flatrate) */}
          {flatrate.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Stream on Subscription
                </h4>
                <span className="text-[10px] text-slate-400">({flatrate.length} services)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {flatrate.map((provider) => (
                  <ProviderCard key={provider.provider_id} provider={provider} link={justWatchLink} badge="Subscription" badgeColor="bg-emerald-500/20 text-emerald-400 border-emerald-500/30" />
                ))}
              </div>
            </div>
          )}

          {/* 2. Free / Ad-Supported */}
          {free.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Free / Ad-Supported Stream
                </h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {free.map((provider) => (
                  <ProviderCard key={provider.provider_id} provider={provider} link={justWatchLink} badge="Free / Ads" badgeColor="bg-amber-500/20 text-amber-400 border-amber-500/30" />
                ))}
              </div>
            </div>
          )}

          {/* 3. Rent & Buy Options */}
          {(rent.length > 0 || buy.length > 0) && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Rent & Digital Purchase
                </h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {/* Deduplicate rent & buy providers to show clean list */}
                {Array.from(new Map([...rent, ...buy].map((p) => [p.provider_id, p])).values()).map((provider) => (
                  <ProviderCard
                    key={provider.provider_id}
                    provider={provider}
                    link={justWatchLink}
                    badge={rent.some((r) => r.provider_id === provider.provider_id) && buy.some((b) => b.provider_id === provider.provider_id) ? 'Rent / Buy' : rent.some((r) => r.provider_id === provider.provider_id) ? 'Rent' : 'Buy'}
                    badgeColor="bg-orange-500/20 text-orange-300 border-orange-500/30"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Footer JustWatch CTA & Attribution */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/[0.06] text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span>Powered by</span>
              <a
                href={justWatchLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-amber-400 hover:underline"
              >
                JustWatch
              </a>
              <span>• Availability in {countryConfig.name}</span>
            </div>

            <a
              href={justWatchLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300 transition"
            >
              <span>View full pricing & stream details</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </section>
  );
};

interface ProviderCardProps {
  provider: TMDBWatchProviderItem;
  link: string;
  badge?: string;
  badgeColor?: string;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ provider, link, badge, badgeColor }) => {
  const logoUrl = provider.logo_path
    ? `https://image.tmdb.org/t/p/w92${provider.logo_path}`
    : null;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2.5 p-2 rounded-xl bg-black/40 border border-white/[0.07] hover:border-orange-500/50 hover:bg-white/[0.04] transition"
      title={`Watch on ${provider.provider_name}`}
    >
      <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-white/10 flex items-center justify-center">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={provider.provider_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <Tv className="w-4 h-4 text-slate-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-white truncate group-hover:text-orange-300 transition-colors">
          {provider.provider_name}
        </p>
        {badge && (
          <span className={`inline-block px-1.5 py-0.2 text-[9px] font-bold rounded border ${badgeColor || 'bg-white/10 text-slate-300 border-white/20'} mt-0.5`}>
            {badge}
          </span>
        )}
      </div>
    </a>
  );
};

