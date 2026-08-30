/**
 * OrangeFlix Geo Country Showcase Section
 * Compact, low-height pills bar allowing quick switching across African & Global cinema territories.
 */

import { Link } from 'react-router-dom';
import { GeoCountryConfig } from '@/types/geo-content';
import { Globe } from 'lucide-react';

interface GeoCountryShowcaseProps {
  currentCountryCode?: string;
  countries: GeoCountryConfig[];
  onSelectCountry?: (code: string) => void;
}

export default function GeoCountryShowcase({
  currentCountryCode = 'RW',
  countries,
  onSelectCountry,
}: GeoCountryShowcaseProps) {
  return (
    <section className="py-2 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" /> Explore Cinema Territories
        </p>
      </div>

      {/* Compact, Sleek Pill Chips (Low Height & Clean Responsive Layout) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {countries.map((c) => {
          const isActive = c.countryCode.toUpperCase() === currentCountryCode.toUpperCase();
          return (
            <Link
              key={c.countryCode}
              to={`/${c.countryCode.toLowerCase()}/movies`}
              onClick={() => onSelectCountry?.(c.countryCode)}
              className={`inline-flex items-center gap-2 h-8 px-3 rounded-full text-xs font-semibold shrink-0 transition-all duration-200 border ${
                isActive
                  ? 'bg-orange-500 border-orange-400 text-white shadow-md shadow-orange-500/25 scale-[1.03]'
                  : 'bg-gray-900/80 border-gray-800 text-gray-300 hover:text-white hover:border-orange-500/40 hover:bg-gray-800'
              }`}
            >
              <span className="text-sm">{c.flagEmoji}</span>
              <span className="truncate">{c.name}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
