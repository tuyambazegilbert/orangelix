/**
 * OrangeFlix Geo Country Showcase Section
 * Ultra-compact, space-optimized territory ribbon for seamless regional cinema switching.
 */

import { Link } from 'react-router-dom';
import { GeoCountryConfig } from '@/types/geo-content';
import { Globe } from 'lucide-react';

interface GeoCountryShowcaseProps {
  currentCountryCode?: string;
  countries: GeoCountryConfig[];
  onSelectCountry?: (code: string) => void;
  showTitle?: boolean;
}

export default function GeoCountryShowcase({
  currentCountryCode = 'RW',
  countries,
  onSelectCountry,
  showTitle = true,
}: GeoCountryShowcaseProps) {
  return (
    <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none py-1">
      {showTitle && (
        <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1 shrink-0 select-none">
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Territory:</span>
        </span>
      )}

      <div className="flex items-center gap-1.5 shrink-0">
        {countries.map((c) => {
          const isActive = c.countryCode.toUpperCase() === currentCountryCode.toUpperCase();
          return (
            <Link
              key={c.countryCode}
              to={`/${c.countryCode.toLowerCase()}/movies`}
              onClick={() => onSelectCountry?.(c.countryCode)}
              className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-semibold shrink-0 transition-all duration-150 border ${
                isActive
                  ? 'bg-orange-500 border-orange-400 text-white shadow-sm shadow-orange-500/30 font-bold'
                  : 'bg-white/[.04] border-white/10 text-slate-300 hover:text-white hover:border-orange-500/40 hover:bg-white/[.08]'
              }`}
            >
              <span className="text-xs">{c.flagEmoji}</span>
              <span className="truncate">{c.name}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
