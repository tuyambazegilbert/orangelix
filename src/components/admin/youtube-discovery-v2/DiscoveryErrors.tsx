/**
 * OrangeFlix YouTube Discovery V2 — Errors Diagnostic Component
 * Recent execution errors, quota warnings, and retry actions.
 */

import React from 'react';
import {
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react';
import { DiscoveryRun } from '@/features/youtube/discoveryV2/types';

interface DiscoveryErrorsProps {
  runs: DiscoveryRun[];
  onRetryScan: (countryCode: string) => Promise<void>;
  isScanning: boolean;
}

export const DiscoveryErrors: React.FC<DiscoveryErrorsProps> = ({
  runs,
  onRetryScan,
  isScanning,
}) => {
  // Extract all errors from runs
  const allErrors: Array<{ runId: string; countryCode: string; error: string; timestamp: Date }> = [];

  runs.forEach((r) => {
    if (r.errorLog && r.errorLog.length > 0) {
      r.errorLog.forEach((msg) => {
        allErrors.push({
          runId: r.runId,
          countryCode: r.countryCodes[0] || 'RW',
          error: msg,
          timestamp: new Date(r.startedAt),
        });
      });
    }
  });

  return (
    <div className="space-y-4">
      <div className="bg-card/60 border border-border rounded-xl p-5">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          Discovery Error & Diagnostic Logs
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review recent YouTube API rate limits, Firestore write issues, and metadata extraction warnings.
        </p>
      </div>

      {allErrors.length === 0 ? (
        <div className="bg-card/40 border border-border rounded-xl p-12 text-center text-sm text-muted-foreground space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <div className="font-semibold text-foreground">Zero Diagnostic Errors</div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            All recent Discovery V2 runs completed with clean execution and healthy API connectivity.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {allErrors.map((err, idx) => (
            <div
              key={idx}
              className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                    {err.countryCode}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{err.runId}</span>
                  <span className="text-xs text-muted-foreground">
                    • {err.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs text-rose-200 font-mono">{err.error}</div>
              </div>

              <button
                onClick={() => onRetryScan(err.countryCode)}
                disabled={isScanning}
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 self-end sm:self-center"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>Retry Scan</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
