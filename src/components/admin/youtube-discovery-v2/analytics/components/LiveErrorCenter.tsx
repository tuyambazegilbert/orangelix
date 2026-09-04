/**
 * OrangeFlix Discovery V2 — Live Operational Error Center
 * Unified live error logs (Supabase/Sentry style) with service tagging, severity filters,
 * run associations, and one-click diagnostic scan retries.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { DiscoveryRun, DiscoveryProgressEvent } from '@/features/youtube/discoveryV2/types';
import { SUPPORTED_COUNTRIES } from '@/features/geo/countryConfig';

interface LiveErrorCenterProps {
  runs: DiscoveryRun[];
  events: DiscoveryProgressEvent[];
  onRetryScan?: (countryCode: string) => void;
  isScanning?: boolean;
}

export const LiveErrorCenter: React.FC<LiveErrorCenterProps> = ({
  runs,
  events,
  onRetryScan,
  isScanning = false,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  // Collect run errors + event errors
  const errorLogs: Array<{
    id: string;
    timestamp: Date | string;
    countryCode: string;
    service: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    details?: string;
  }> = [];

  runs.forEach((r) => {
    if (r.status === 'failed' || (r.errors && r.errors.length > 0) || r.quotaErrors > 0) {
      if (r.errors && r.errors.length > 0) {
        r.errors.forEach((errStr, idx) => {
          errorLogs.push({
            id: `run-${r.runId}-${idx}`,
            timestamp: r.startedAt,
            countryCode: r.countryCode,
            service: errStr.includes('quota') ? 'YouTube API 429' : 'Discovery Engine',
            severity: 'critical',
            message: errStr,
            details: `Run ID: ${r.runId} • Mode: ${r.mode} • Candidates: ${r.candidatesFound}`,
          });
        });
      }
      if (r.quotaErrors > 0) {
        errorLogs.push({
          id: `quota-${r.runId}`,
          timestamp: r.startedAt,
          countryCode: r.countryCode,
          service: 'YouTube Data API',
          severity: 'critical',
          message: `YouTube API Quota Limit Exceeded (429 Rate Limit Hit)`,
          details: `Run ID: ${r.runId} • ${r.summary}`,
        });
      }
    }
  });

  events.forEach((evt) => {
    if (evt.level === 'error' || evt.level === 'warning') {
      errorLogs.push({
        id: evt.id,
        timestamp: evt.timestamp,
        countryCode: evt.countryCode || 'GLOBAL',
        service: evt.stage === 'query_dispatch' ? 'YouTube API' : evt.stage === 'classification' ? 'V2 Classifier' : 'Pipeline',
        severity: evt.level === 'error' ? 'critical' : 'warning',
        message: evt.message,
        details: evt.details ? JSON.stringify(evt.details) : undefined,
      });
    }
  });

  const filtered = errorLogs.filter((log) => {
    if (severityFilter !== 'all' && log.severity !== severityFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.service.toLowerCase().includes(q) ||
        log.countryCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/80 rounded-xl p-5 space-y-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Operational Error Center & Health Telemetry
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time searchable error feed for diagnosing quota limits, YouTube API 429s, schema validation warnings, and network timeouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search error logs..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-secondary/60 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        {[
          { id: 'all', label: `All Events (${errorLogs.length})` },
          { id: 'critical', label: '🔴 Critical Errors' },
          { id: 'warning', label: '🟡 Warnings' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSeverityFilter(t.id as 'all' | 'critical' | 'warning' | 'info')}
            className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors ${
              severityFilter === t.id
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Error Logs List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          <div className="font-bold text-foreground">Zero Active Operational Errors</div>
          <p className="text-[11px] max-w-sm text-muted-foreground">
            All discovery queries, YouTube API calls, classifier stages, and Firestore persistence operations are functioning healthily.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((log) => {
            const country = SUPPORTED_COUNTRIES[log.countryCode];
            const flag = country ? country.flagEmoji : '🌍';
            const timeStr = new Date(log.timestamp).toLocaleString();

            return (
              <div
                key={log.id}
                className="bg-secondary/30 hover:bg-secondary/60 border border-border/70 rounded-xl p-3.5 space-y-2 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{flag}</span>
                    <span className="font-bold text-xs text-foreground uppercase">{log.countryCode}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-secondary text-muted-foreground">
                      {log.service}
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        log.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {log.severity}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeStr}
                    </span>

                    {onRetryScan && log.countryCode && log.countryCode !== 'GLOBAL' && (
                      <button
                        onClick={() => onRetryScan(log.countryCode)}
                        disabled={isScanning}
                        className="px-2.5 py-1 text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry {log.countryCode}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs font-mono font-semibold text-rose-300 bg-black/30 p-2.5 rounded-lg border border-border/40">
                  {log.message}
                </div>

                {log.details && (
                  <div className="text-[11px] text-muted-foreground truncate font-mono">
                    {log.details}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

