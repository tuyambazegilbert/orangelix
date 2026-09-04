/**
 * OrangeFlix YouTube Discovery V2 — Runs Audit Log Component
 * Complete historical execution logs, performance metrics, and error diagnostics.
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Zap,
  Trash2,
  RefreshCw,
  Play,
  Filter,
} from 'lucide-react';
import { DiscoveryRun } from '@/features/youtube/discoveryV2/types';
import { DiscoveryRunRepository } from '@/services/discovery-v2/discoveryRunRepository';
import { toast } from 'sonner';

interface DiscoveryRunsProps {
  runs: DiscoveryRun[];
  isLoading: boolean;
  onTriggerScan?: (countryCode: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export const DiscoveryRuns: React.FC<DiscoveryRunsProps> = ({
  runs,
  isLoading,
  onTriggerScan,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [isCleaningStale, setIsCleaningStale] = useState(false);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);

  // Helper: check if run is stale (running > 15m)
  const isStaleRun = (run: DiscoveryRun) => {
    if (run.status !== 'running') return false;
    const started = new Date(run.startedAt).getTime();
    return Date.now() - started > 15 * 60 * 1000;
  };

  // Helper: format duration
  const formatDuration = (start: Date | string, end?: Date | string) => {
    const s = new Date(start).getTime();
    const e = end ? new Date(end).getTime() : Date.now();
    const diffSec = Math.max(0, Math.round((e - s) / 1000));
    if (diffSec < 60) return `${diffSec}s`;
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins}m ${secs}s`;
  };

  // Stale runs count
  const staleRunsCount = useMemo(() => {
    return runs.filter(isStaleRun).length;
  }, [runs]);

  // Aggregate stats
  const kpis = useMemo(() => {
    let completed = 0;
    let running = 0;
    let interrupted = 0;
    let failed = 0;
    let totalCandidates = 0;
    let totalCacheHits = 0;
    let totalQueries = 0;

    runs.forEach((r) => {
      if (isStaleRun(r)) {
        interrupted++;
      } else if (r.status === 'completed') {
        completed++;
      } else if (r.status === 'running') {
        running++;
      } else {
        failed++;
      }

      totalCandidates += r.candidatesFound || 0;
      totalCacheHits += r.cacheHits || 0;
      totalQueries += r.queriesExecuted || 0;
    });

    const cacheRate = totalQueries > 0 ? Math.round((totalCacheHits / totalQueries) * 100) : 0;

    return {
      total: runs.length,
      completed,
      running,
      interrupted,
      failed,
      totalCandidates,
      cacheRate,
    };
  }, [runs]);

  // Filtered runs
  const filtered = useMemo(() => {
    return runs.filter((r) => {
      const isStale = isStaleRun(r);

      // Status filter
      if (statusFilter === 'completed' && r.status !== 'completed') return false;
      if (statusFilter === 'running' && (r.status !== 'running' || isStale)) return false;
      if (statusFilter === 'interrupted' && !isStale) return false;
      if (statusFilter === 'failed' && r.status !== 'failed' && r.status !== 'quota_exhausted') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = r.runId.toLowerCase().includes(q);
        const matchCountry = r.countryCodes.some((c) => c.toLowerCase().includes(q));
        const matchSummary = (r.summary || '').toLowerCase().includes(q);
        if (!matchId && !matchCountry && !matchSummary) return false;
      }
      return true;
    });
  }, [runs, statusFilter, searchQuery]);

  const toggleExpand = (runId: string) => {
    setExpandedRunId(expandedRunId === runId ? null : runId);
  };

  // Clean up stale runs action
  const handleCleanUpStale = async () => {
    setIsCleaningStale(true);
    try {
      const updated = await DiscoveryRunRepository.cleanUpStaleRuns(15);
      if (updated > 0) {
        toast.success(`Successfully resolved ${updated} stale/interrupted run(s).`);
      } else {
        toast.info('No stale runs found to clean up.');
      }
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error('Failed to clean up stale runs.');
    } finally {
      setIsCleaningStale(false);
    }
  };

  // Delete run action
  const handleDeleteRun = async (runId: string) => {
    setDeletingRunId(runId);
    try {
      const ok = await DiscoveryRunRepository.deleteRun(runId);
      if (ok) {
        toast.success(`Deleted audit record for run ${runId}`);
        if (onRefresh) await onRefresh();
      } else {
        toast.error('Failed to delete run from database.');
      }
    } catch (err) {
      toast.error('Error deleting discovery run.');
    } finally {
      setDeletingRunId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top KPI Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-card/60 border border-border rounded-xl p-3">
          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Recorded Runs</div>
          <div className="text-xl font-bold text-foreground mt-0.5">{kpis.total}</div>
        </div>

        <div className="bg-card/60 border border-border rounded-xl p-3">
          <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Completed</div>
          <div className="text-xl font-bold text-emerald-400 mt-0.5">{kpis.completed}</div>
        </div>

        <div className="bg-card/60 border border-border rounded-xl p-3">
          <div className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">Active Running</div>
          <div className="text-xl font-bold text-blue-400 mt-0.5">{kpis.running}</div>
        </div>

        <div className="bg-card/60 border border-border rounded-xl p-3">
          <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">Interrupted / Stale</div>
          <div className="text-xl font-bold text-amber-400 mt-0.5">{kpis.interrupted}</div>
        </div>

        <div className="bg-card/60 border border-border rounded-xl p-3">
          <div className="text-[10px] text-orange-400 uppercase font-bold tracking-wider">Discovered Items</div>
          <div className="text-xl font-bold text-orange-400 mt-0.5">{kpis.totalCandidates}</div>
        </div>

        <div className="bg-card/60 border border-border rounded-xl p-3">
          <div className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">Cache Efficiency</div>
          <div className="text-xl font-bold text-cyan-400 mt-0.5">{kpis.cacheRate}%</div>
        </div>
      </div>

      {/* Action and Filter Control Bar */}
      <div className="bg-card/60 border border-border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search run ID, country, summary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg p-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({runs.length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                statusFilter === 'completed'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Completed ({kpis.completed})
            </button>
            <button
              onClick={() => setStatusFilter('running')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                statusFilter === 'running'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Running ({kpis.running})
            </button>
            {kpis.interrupted > 0 && (
              <button
                onClick={() => setStatusFilter('interrupted')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  statusFilter === 'interrupted'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                Interrupted ({kpis.interrupted})
              </button>
            )}
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                statusFilter === 'failed'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Failed ({kpis.failed})
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {staleRunsCount > 0 && (
            <button
              onClick={handleCleanUpStale}
              disabled={isCleaningStale}
              className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
              title="Mark runs abandoned in running state (>15 min) as interrupted"
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${isCleaningStale ? 'animate-spin' : ''}`} />
              <span>Clean Up Stale Runs ({staleRunsCount})</span>
            </button>
          )}

          {onRefresh && (
            <button
              onClick={() => onRefresh()}
              disabled={isLoading}
              className="p-1.5 bg-card border border-border hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh runs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Runs Table */}
      <div className="bg-card/60 border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground border-b border-border bg-secondary/20 font-medium">
              <tr>
                <th className="py-3 px-4">Run ID</th>
                <th className="py-3 px-3">Territories</th>
                <th className="py-3 px-3">Mode</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3">Queries</th>
                <th className="py-3 px-3">Candidates (Pub / Pend / Rej)</th>
                <th className="py-3 px-3">Cache Hits</th>
                <th className="py-3 px-3">Started</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-sm text-muted-foreground">
                    No discovery runs match your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((run) => {
                  const isExpanded = expandedRunId === run.runId;
                  const hasErrors = run.errorLog && run.errorLog.length > 0;
                  const isStale = isStaleRun(run);
                  const isDeleting = deletingRunId === run.runId;

                  return (
                    <React.Fragment key={run.runId}>
                      <tr className="hover:bg-muted/30 transition-colors">
                        {/* Run ID */}
                        <td className="py-3 px-4 font-mono font-medium text-foreground">
                          <span className="text-orange-400">{run.runId}</span>
                        </td>

                        {/* Territories */}
                        <td className="py-3 px-3 font-semibold text-foreground">
                          {run.countryCodes.length > 0 ? run.countryCodes.join(', ') : 'Global'}
                        </td>

                        {/* Mode */}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-secondary-foreground uppercase">
                            {run.mode}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          {isStale ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3" /> Interrupted
                            </span>
                          ) : run.status === 'completed' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          ) : run.status === 'running' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3 animate-spin" /> Running
                            </span>
                          ) : run.status === 'quota_exhausted' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3" /> Quota Hit
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3" /> Failed
                            </span>
                          )}
                        </td>

                        {/* Duration */}
                        <td className="py-3 px-3 text-muted-foreground font-mono text-[11px]">
                          {formatDuration(run.startedAt, run.completedAt)}
                        </td>

                        {/* Queries */}
                        <td className="py-3 px-3 text-muted-foreground">
                          {run.queriesExecuted}
                        </td>

                        {/* Candidates Found */}
                        <td className="py-3 px-3 text-muted-foreground">
                          <strong className="text-foreground">{run.candidatesFound}</strong> (
                          <span className="text-emerald-400 font-medium">{run.published}</span> /{' '}
                          <span className="text-amber-400 font-medium">{run.pendingReview}</span> /{' '}
                          <span className="text-rose-400 font-medium">{run.rejected}</span>)
                        </td>

                        {/* Cache Hits */}
                        <td className="py-3 px-3 text-blue-400 font-medium">
                          {run.cacheHits} / {run.cacheHits + run.cacheMisses}
                        </td>

                        {/* Started At */}
                        <td className="py-3 px-3 text-muted-foreground">
                          {new Date(run.startedAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {onTriggerScan && run.countryCodes.length > 0 && (
                              <button
                                onClick={() => onTriggerScan(run.countryCodes[0])}
                                className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-orange-400 transition-colors"
                                title={`Re-run discovery for ${run.countryCodes[0]}`}
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteRun(run.runId)}
                              disabled={isDeleting}
                              className="p-1 hover:bg-rose-500/20 rounded text-muted-foreground hover:text-rose-400 transition-colors"
                              title="Delete this run record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => toggleExpand(run.runId)}
                              className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                              title={isExpanded ? 'Collapse' : 'Expand details'}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-secondary/20">
                          <td colSpan={10} className="p-4 space-y-3 border-b border-border/60">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-card/60 border border-border/40 rounded-lg p-3">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Detailed Summary</span>
                                <p className="text-xs text-foreground mt-0.5">{run.summary}</p>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Catalog Impact</span>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  🎬 {run.moviesFound} Movies • 📺 {run.seriesFound} Series • 🎞️ {run.episodesFound} Episodes • 📦 {run.seasonsFound} Seasons
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Execution Timings</span>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Started: {new Date(run.startedAt).toLocaleString()}<br />
                                  Completed: {run.completedAt ? new Date(run.completedAt).toLocaleString() : isStale ? 'Interrupted (No exit signal)' : 'In progress'}
                                </p>
                              </div>
                            </div>

                            {hasErrors && (
                              <div className="space-y-1.5">
                                <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                                  <AlertTriangle className="w-4 h-4" /> Logged Diagnostics ({run.errorLog?.length}):
                                </div>
                                <div className="bg-black/70 border border-rose-500/20 rounded-lg p-3 font-mono text-[11px] text-rose-300 space-y-1 overflow-x-auto">
                                  {run.errorLog?.map((err, i) => (
                                    <div key={i} className="flex items-start gap-1.5">
                                      <span className="text-rose-500 font-bold">•</span>
                                      <span>{err}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
