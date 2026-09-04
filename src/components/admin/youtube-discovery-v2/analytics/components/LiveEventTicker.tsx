/**
 * OrangeFlix Discovery V2 — Live Operations Event Ticker
 * Real-time event ticker showing real incoming discovery events, candidate classifications,
 * gap detections, and publication decisions.
 */

import React from 'react';
import { Radio, Activity, Film, AlertTriangle, CheckCircle, ArrowUpRight } from 'lucide-react';
import { DiscoveryProgressEvent } from '@/features/youtube/discoveryV2/types';
import { SUPPORTED_COUNTRIES } from '@/features/geo/countryConfig';

interface LiveEventTickerProps {
  events: DiscoveryProgressEvent[];
  isScanning?: boolean;
  onDrillDownEvents: () => void;
}

export const LiveEventTicker: React.FC<LiveEventTickerProps> = ({
  events,
  isScanning = false,
  onDrillDownEvents,
}) => {
  const recentEvents = events.slice(0, 6);

  return (
    <div className="bg-card/70 border border-border/80 rounded-xl p-3 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isScanning ? 'bg-emerald-400' : 'bg-blue-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isScanning ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
            </span>
            <span>Live Discovery Event Stream</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono">
            {events.length} events logged
          </span>
        </div>

        <button
          onClick={onDrillDownEvents}
          className="text-[11px] font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
        >
          <span>View All Logs</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      {recentEvents.length === 0 ? (
        <div className="py-2.5 text-center text-xs text-muted-foreground bg-secondary/30 rounded-lg">
          No live events in buffer. Start a scan or wait for background discovery.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {recentEvents.map((evt) => {
            const country = evt.countryCode ? SUPPORTED_COUNTRIES[evt.countryCode] : null;
            const flag = country ? country.flagEmoji : '🌍';
            const timeStr = new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            return (
              <div
                key={evt.id}
                className="bg-secondary/40 hover:bg-secondary/70 border border-border/60 rounded-lg px-2.5 py-2 text-xs flex items-start justify-between gap-2 transition-all cursor-pointer"
                onClick={onDrillDownEvents}
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-sm leading-none">{flag}</span>
                    <span className="font-bold text-foreground uppercase">{evt.countryCode || 'GLOBAL'}</span>
                    <span className="text-muted-foreground font-mono text-[10px]">{timeStr}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                        evt.level === 'success'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : evt.level === 'warning'
                          ? 'bg-amber-500/20 text-amber-400'
                          : evt.level === 'error'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {evt.stage}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{evt.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
