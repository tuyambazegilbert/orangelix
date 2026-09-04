/**
 * OrangeFlix YouTube Discovery V2 — Countries Component
 * Territory configurations, cinema profiles, and country-level discovery controls.
 */

import React from 'react';
import {
  Globe2,
  Film,
  Tv,
  Zap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { SUPPORTED_COUNTRIES } from '@/features/geo/countryConfig';

interface DiscoveryCountriesProps {
  onTriggerScan: (countryCode: string) => Promise<void>;
  isScanning: boolean;
}

export const DiscoveryCountries: React.FC<DiscoveryCountriesProps> = ({
  onTriggerScan,
  isScanning,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-card/60 border border-border rounded-xl p-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-blue-400" />
          Supported Discovery Territories (8 Countries)
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Each territory features dedicated multilingual keyword expansions, demonyms, cultural cinema terminology, and approved channels.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(SUPPORTED_COUNTRIES).map(([code, config]) => (
          <div
            key={code}
            className="bg-card/60 border border-border hover:border-orange-500/40 rounded-xl p-5 space-y-3 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl">{config.flagEmoji}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-secondary-foreground uppercase">
                  {code}
                </span>
              </div>

              <h3 className="text-base font-bold text-foreground mt-2">{config.name}</h3>
              <p className="text-xs text-muted-foreground">{config.nativeName || config.name}</p>

              <div className="space-y-1.5 mt-3 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Demonym:</span>
                  <span className="font-semibold text-foreground">{config.demonym}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Languages:</span>
                  <span className="font-semibold text-foreground">{config.languages.join(', ')}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Min Movie Duration:</span>
                  <span className="font-semibold text-foreground">{config.minMovieDurationMinutes}m</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Preconfigured Queries:</span>
                  <span className="font-semibold text-foreground">
                    {config.movieQueries.length + config.seriesQueries.length}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onTriggerScan(code)}
              disabled={isScanning}
              className="w-full py-2 bg-secondary hover:bg-orange-500 hover:text-white text-foreground text-xs font-semibold rounded-lg border border-border transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-orange-400" />
              <span>Scan {config.name}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
