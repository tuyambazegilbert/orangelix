/**
 * OrangeFlix YouTube Discovery V2 — Quota Diagnostics Component
 * YouTube API v3 quota consumption estimator, cost breakdown, and efficiency tips.
 */

import React from 'react';
import {
  Zap,
  ShieldCheck,
  AlertTriangle,
  Database,
  Info,
} from 'lucide-react';

export const DiscoveryQuota: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-card/60 border border-border rounded-xl p-5">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-400" />
          YouTube Data API v3 Quota Diagnostics
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Standard YouTube Data API free tier provides 10,000 quota units per calendar day (resets at midnight Pacific Time).
        </p>
      </div>

      {/* Quota Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card/40 border border-border rounded-xl p-4 space-y-1.5">
          <div className="text-xs font-semibold text-muted-foreground">Search Request (`search.list`)</div>
          <div className="text-2xl font-bold text-orange-400">100 units</div>
          <div className="text-[11px] text-muted-foreground">Per keyword search page execution</div>
        </div>

        <div className="bg-card/40 border border-border rounded-xl p-4 space-y-1.5">
          <div className="text-xs font-semibold text-muted-foreground">Video Metadata (`videos.list`)</div>
          <div className="text-2xl font-bold text-emerald-400">1 unit</div>
          <div className="text-[11px] text-muted-foreground">Per batch of up to 50 video IDs</div>
        </div>

        <div className="bg-card/40 border border-border rounded-xl p-4 space-y-1.5">
          <div className="text-xs font-semibold text-muted-foreground">Channel Uploads (`playlistItems`)</div>
          <div className="text-2xl font-bold text-blue-400">1 unit</div>
          <div className="text-[11px] text-muted-foreground">Per 50 videos from approved channel</div>
        </div>
      </div>

      {/* Optimization Architecture */}
      <div className="bg-card/60 border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          V2 Quota Conservation Strategy
        </h3>
        <ul className="space-y-2.5 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <span>
              <strong className="text-foreground">Persistent Search Caching:</strong> All YouTube search results are saved in Firestore for 3–7 days. Subsequent scans reuse cached video IDs, cutting quota costs to 0 units.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <span>
              <strong className="text-foreground">Video Index Verification:</strong> Before querying metadata for 50 IDs, Discovery V2 checks `videoIndex` in Firestore. Only new or stale videos (30+ days) fetch fresh metadata.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <span>
              <strong className="text-foreground">Channel Upload Playlists:</strong> Scanning approved channels uses `playlistItems.list` (1 unit) rather than expensive keyword search (100 units), generating 100x more candidate videos per quota unit.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
