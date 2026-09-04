/**
 * OrangeFlix YouTube Discovery V2 — Analytics V2 Command Center
 * Supabase/Grafana-grade Observability + Mixpanel-grade Product Analytics + Discovery Operations Center.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  Activity,
  Layers,
  Globe,
  Languages,
  Search,
  ShieldCheck,
  Tv,
  Radio,
  Zap,
  AlertTriangle,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  AnalyticsFilterState,
  AnalyticsSubView,
  SavedAnalyticsView,
  DrillDownTarget,
  DiscoveryAnalyticsProps,
} from './analytics/types';
import { AnalyticsAggregator } from './analytics/utils/analyticsAggregator';
import {
  DEFAULT_ANALYTICS_FILTERS,
  encodeFiltersToSearchParams,
  decodeFiltersFromSearchParams,
} from './analytics/utils/urlState';

import { AnalyticsControlBar } from './analytics/components/AnalyticsControlBar';
import { LiveEventTicker } from './analytics/components/LiveEventTicker';
import { ExecutiveKPICards } from './analytics/components/ExecutiveKPICards';
import { DiscoveryConversionFunnel } from './analytics/components/DiscoveryConversionFunnel';
import { TerritoryIntelligenceMatrix } from './analytics/components/TerritoryIntelligenceMatrix';
import { MultilingualIntelligence } from './analytics/components/MultilingualIntelligence';
import { QueryPerformanceIntelligence } from './analytics/components/QueryPerformanceIntelligence';
import { ScoringAndSafetyBreakdown } from './analytics/components/ScoringAndSafetyBreakdown';
import { SeriesCoverageMatrix } from './analytics/components/SeriesCoverageMatrix';
import { ChannelTrustIntelligence } from './analytics/components/ChannelTrustIntelligence';
import { ApiQuotaObservability } from './analytics/components/ApiQuotaObservability';
import { LiveErrorCenter } from './analytics/components/LiveErrorCenter';
import { SavedViewsModal } from './analytics/components/SavedViewsModal';
import { DataDrillDownModal } from './analytics/components/DataDrillDownModal';

const DEFAULT_SAVED_VIEWS: SavedAnalyticsView[] = [
  {
    id: 'default-all',
    name: '🌍 Global Platform Overview',
    description: 'All 8 territories, all content types and languages',
    filters: DEFAULT_ANALYTICS_FILTERS,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDefault: true,
  },
  {
    id: 'preset-east-africa',
    name: '🦒 East Africa Cinema (RW, UG, KE, TZ)',
    description: 'Rwanda, Uganda, Kenya, Tanzania regional cinema filter',
    filters: {
      ...DEFAULT_ANALYTICS_FILTERS,
      territories: ['RW', 'UG', 'KE', 'TZ'],
      timeRange: '7d',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'preset-nollywood',
    name: '🇳🇬 Nollywood & West Africa Pipeline',
    description: 'Nigeria & Ghana film and series production tracking',
    filters: {
      ...DEFAULT_ANALYTICS_FILTERS,
      territories: ['NG', 'GH'],
      timeRange: '30d',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'preset-series-gaps',
    name: '📺 Series & Episodic Gaps',
    description: 'Shows and episodes requiring targeted discovery',
    filters: {
      ...DEFAULT_ANALYTICS_FILTERS,
      contentTypes: ['series', 'episode'],
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'preset-low-quality',
    name: '⚠️ Gated & Low Quality Audit',
    description: 'Candidates with score < 50 for safety review',
    filters: {
      ...DEFAULT_ANALYTICS_FILTERS,
      maxScore: 49,
      statuses: ['rejected', 'pending_review'],
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const DiscoveryAnalytics: React.FC<DiscoveryAnalyticsProps> = ({
  metrics,
  contentItems = [],
  seriesList = [],
  episodesList = [],
  channels = [],
  queries = [],
  runs = [],
  liveLogs = [],
  isScanning = false,
  selectedCountry = 'ALL',
  onSelectCountry,
  onInspectItem,
  onTriggerScan,
  onNavigateTab,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Sub-View in Analytics Center
  const [activeSubView, setActiveSubView] = useState<AnalyticsSubView>('overview');

  // Filter State initialized from URL params if present
  const [filters, setFilters] = useState<AnalyticsFilterState>(() => {
    const fromUrl = decodeFiltersFromSearchParams(searchParams);
    if (selectedCountry && selectedCountry !== 'ALL' && fromUrl.territories.includes('ALL')) {
      return { ...fromUrl, territories: [selectedCountry] };
    }
    return fromUrl;
  });

  // Saved Views State
  const [savedViews, setSavedViews] = useState<SavedAnalyticsView[]>(() => {
    try {
      const stored = localStorage.getItem('orangeflix_analytics_saved_views');
      return stored ? JSON.parse(stored) : DEFAULT_SAVED_VIEWS;
    } catch {
      return DEFAULT_SAVED_VIEWS;
    }
  });

  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [drillDownTarget, setDrillDownTarget] = useState<DrillDownTarget | null>(null);

  // Sync filters to URL params
  const updateUrlParams = useCallback(
    (newFilters: AnalyticsFilterState) => {
      const p = encodeFiltersToSearchParams(newFilters);
      setSearchParams(p, { replace: true });
    },
    [setSearchParams]
  );

  const handleUpdateFilters = useCallback(
    (updater: (prev: AnalyticsFilterState) => AnalyticsFilterState) => {
      setFilters((prev) => {
        const next = updater(prev);
        updateUrlParams(next);
        if (onSelectCountry && next.territories !== prev.territories) {
          if (next.territories.length === 1 && next.territories[0] !== 'ALL') {
            onSelectCountry(next.territories[0]);
          } else if (next.territories.length === 0 || next.territories.includes('ALL')) {
            onSelectCountry('ALL');
          }
        }
        return next;
      });
    },
    [updateUrlParams, onSelectCountry]
  );

  const handleResetFilters = () => {
    setFilters(DEFAULT_ANALYTICS_FILTERS);
    updateUrlParams(DEFAULT_ANALYTICS_FILTERS);
    if (onSelectCountry) onSelectCountry('ALL');
    toast.info('Analytics filters reset to platform-wide default.');
  };

  const handleSaveView = (newView: SavedAnalyticsView) => {
    const updated = [newView, ...savedViews.filter((v) => v.id !== newView.id)];
    setSavedViews(updated);
    try {
      localStorage.setItem('orangeflix_analytics_saved_views', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };

  const handleDeleteView = (id: string) => {
    const updated = savedViews.filter((v) => v.id !== id);
    setSavedViews(updated);
    try {
      localStorage.setItem('orangeflix_analytics_saved_views', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to delete from localStorage:', e);
    }
    toast.success('Saved view removed.');
  };

  const handleLoadView = (view: SavedAnalyticsView) => {
    setFilters(view.filters);
    updateUrlParams(view.filters);
    toast.success(`Loaded analytical preset: "${view.name}"`);
  };

  // Compute live last-event timestamp
  const lastEventTimestamp = useMemo(() => {
    if (liveLogs.length > 0 && liveLogs[0].timestamp) {
      return new Date(liveLogs[0].timestamp).getTime();
    }
    if (runs.length > 0 && runs[0].completedAt) {
      return new Date(runs[0].completedAt).getTime();
    }
    if (runs.length > 0 && runs[0].startedAt) {
      return new Date(runs[0].startedAt).getTime();
    }
    return Date.now() - 4 * 60 * 1000;
  }, [liveLogs, runs]);

  // Reactive Analytical Computations
  const filteredDataset = useMemo(() => {
    return AnalyticsAggregator.filterData(
      contentItems,
      runs,
      queries,
      channels,
      seriesList,
      episodesList,
      liveLogs,
      filters
    );
  }, [contentItems, runs, queries, channels, seriesList, episodesList, liveLogs, filters]);

  const kpis = useMemo(() => {
    return AnalyticsAggregator.computeKPIs(
      filteredDataset.filteredItems,
      filteredDataset.previousPeriodItems,
      filteredDataset.filteredChannels,
      filteredDataset.filteredRuns
    );
  }, [filteredDataset]);

  const funnelStages = useMemo(() => {
    return AnalyticsAggregator.computeFunnel(filteredDataset.filteredItems, filteredDataset.filteredRuns);
  }, [filteredDataset]);

  const territoryMatrix = useMemo(() => {
    return AnalyticsAggregator.computeTerritoryMatrix(
      filteredDataset.filteredItems,
      filteredDataset.filteredChannels,
      filters.territories
    );
  }, [filteredDataset, filters.territories]);

  const languageAnalytics = useMemo(() => {
    return AnalyticsAggregator.computeLanguageAnalytics(filteredDataset.filteredItems);
  }, [filteredDataset]);

  const queryIntelligence = useMemo(() => {
    return AnalyticsAggregator.computeQueryIntelligence(queries, filteredDataset.filteredItems);
  }, [queries, filteredDataset]);

  const scoreBuckets = useMemo(() => {
    return AnalyticsAggregator.computeScoreDistribution(filteredDataset.filteredItems);
  }, [filteredDataset]);

  const rejectionReasons = useMemo(() => {
    return AnalyticsAggregator.computeRejectionReasons(filteredDataset.filteredItems);
  }, [filteredDataset]);

  const seriesCoverage = useMemo(() => {
    return AnalyticsAggregator.computeSeriesCoverage(filteredDataset.filteredSeries, filteredDataset.filteredEpisodes);
  }, [filteredDataset]);

  const channelPerformance = useMemo(() => {
    return AnalyticsAggregator.computeChannelPerformance(filteredDataset.filteredChannels, filteredDataset.filteredItems);
  }, [filteredDataset]);

  const quotaObservability = useMemo(() => {
    return AnalyticsAggregator.computeApiQuotaObservability(filteredDataset.filteredRuns, filteredDataset.filteredItems);
  }, [filteredDataset]);

  // Handle Drill Down Click
  const handleDrillDown = (target: DrillDownTarget) => {
    let itemsToPass = filteredDataset.filteredItems;

    if (target.type === 'published') {
      itemsToPass = filteredDataset.filteredItems.filter((i) => i.status === 'published' || i.moderationStatus === 'approved');
    } else if (target.type === 'pending_review') {
      itemsToPass = filteredDataset.filteredItems.filter((i) => i.status === 'pending_review' || i.moderationStatus === 'pending_review');
    } else if (target.type === 'rejected') {
      itemsToPass = filteredDataset.filteredItems.filter((i) => i.status === 'rejected' || i.moderationStatus === 'rejected');
    } else if (target.type === 'movies') {
      itemsToPass = filteredDataset.filteredItems.filter((i) => (i.classification || i.type || i.contentType) === 'movie');
    } else if (target.type === 'series') {
      itemsToPass = filteredDataset.filteredItems.filter((i) => (i.classification || i.type || i.contentType) === 'series');
    } else if (target.type === 'territory' && target.filterValue) {
      itemsToPass = filteredDataset.filteredItems.filter((i) => (i.country || (i as { countryCode?: string }).countryCode || '').toUpperCase() === String(target.filterValue).toUpperCase());
    } else if (target.type === 'language' && target.filterValue) {
      itemsToPass = filteredDataset.filteredItems.filter((i) => (i.language || '').toLowerCase() === String(target.filterValue).toLowerCase());
    } else if (target.type === 'channel' && target.filterValue) {
      itemsToPass = filteredDataset.filteredItems.filter((i) => i.channelId === target.filterValue || i.youtubeChannelId === target.filterValue);
    } else if (target.type === 'query' && target.filterValue) {
      const q = String(target.filterValue).toLowerCase();
      itemsToPass = filteredDataset.filteredItems.filter((i) => (i.title && i.title.toLowerCase().includes(q)) || (i as { query?: string }).query === target.filterValue);
    }

    setDrillDownTarget({
      ...target,
      items: itemsToPass,
    });
  };

  const handleFocusTerritory = (countryCode: string) => {
    handleUpdateFilters((prev) => ({ ...prev, territories: [countryCode] }));
    if (onSelectCountry) onSelectCountry(countryCode);
    toast.info(`📍 Analytics dashboard isolated to ${countryCode}`);
  };

  const subViewTabs: Array<{ id: AnalyticsSubView; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'overview', label: 'Executive Overview', icon: TrendingUp },
    { id: 'live', label: 'Live Operations', icon: Activity },
    { id: 'funnel', label: 'Conversion Funnel', icon: Layers },
    { id: 'territories', label: 'Territories', icon: Globe },
    { id: 'languages', label: 'Multilingual', icon: Languages },
    { id: 'queries', label: 'Queries', icon: Search },
    { id: 'scoring', label: 'Scoring & Gates', icon: ShieldCheck },
    { id: 'series', label: 'Series Gaps', icon: Tv },
    { id: 'channels', label: 'Channel Trust', icon: Radio },
    { id: 'quota', label: 'API & Quota', icon: Zap },
    { id: 'errors', label: 'Error Center', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Sticky Analytics Control Bar */}
      <AnalyticsControlBar
        filters={filters}
        onUpdateFilters={handleUpdateFilters}
        onResetFilters={handleResetFilters}
        savedViews={savedViews}
        onLoadSavedView={handleLoadView}
        onOpenSaveModal={() => setIsSavedModalOpen(true)}
        lastEventTimestamp={lastEventTimestamp}
        isScanning={isScanning}
      />

      {/* 2. Sub-View Navigation Ribbon */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/60 scrollbar-none">
        {subViewTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubView(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Live Event Ticker (Always Visible at Top of Views) */}
      <LiveEventTicker
        events={filteredDataset.filteredLiveEvents}
        isScanning={isScanning}
        onDrillDownEvents={() => setActiveSubView('live')}
      />

      {/* 4. Sub-View Renderings */}
      {activeSubView === 'overview' && (
        <div className="space-y-6">
          <ExecutiveKPICards kpis={kpis} onDrillDown={handleDrillDown} />
          <DiscoveryConversionFunnel funnelStages={funnelStages} onDrillDown={handleDrillDown} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TerritoryIntelligenceMatrix
              territories={territoryMatrix}
              onFocusTerritory={handleFocusTerritory}
              onDrillDown={handleDrillDown}
            />
            <MultilingualIntelligence
              languages={languageAnalytics}
              onDrillDown={handleDrillDown}
            />
          </div>
        </div>
      )}

      {activeSubView === 'live' && (
        <div className="space-y-6">
          <ExecutiveKPICards kpis={kpis} onDrillDown={handleDrillDown} />
          <LiveErrorCenter
            runs={filteredDataset.filteredRuns}
            events={filteredDataset.filteredLiveEvents}
            onRetryScan={onTriggerScan}
            isScanning={isScanning}
          />
        </div>
      )}

      {activeSubView === 'funnel' && (
        <div className="space-y-6">
          <DiscoveryConversionFunnel funnelStages={funnelStages} onDrillDown={handleDrillDown} />
          <ScoringAndSafetyBreakdown
            scoreBuckets={scoreBuckets}
            rejectionReasons={rejectionReasons}
            onDrillDown={handleDrillDown}
          />
        </div>
      )}

      {activeSubView === 'territories' && (
        <TerritoryIntelligenceMatrix
          territories={territoryMatrix}
          onFocusTerritory={handleFocusTerritory}
          onDrillDown={handleDrillDown}
        />
      )}

      {activeSubView === 'languages' && (
        <MultilingualIntelligence
          languages={languageAnalytics}
          onDrillDown={handleDrillDown}
        />
      )}

      {activeSubView === 'queries' && (
        <QueryPerformanceIntelligence
          queries={queryIntelligence}
          onDrillDown={handleDrillDown}
        />
      )}

      {activeSubView === 'scoring' && (
        <ScoringAndSafetyBreakdown
          scoreBuckets={scoreBuckets}
          rejectionReasons={rejectionReasons}
          onDrillDown={handleDrillDown}
        />
      )}

      {activeSubView === 'series' && (
        <SeriesCoverageMatrix
          seriesCoverage={seriesCoverage}
          onDrillDown={handleDrillDown}
        />
      )}

      {activeSubView === 'channels' && (
        <ChannelTrustIntelligence
          channels={channelPerformance}
          onDrillDown={handleDrillDown}
        />
      )}

      {activeSubView === 'quota' && (
        <ApiQuotaObservability quotaData={quotaObservability} />
      )}

      {activeSubView === 'errors' && (
        <LiveErrorCenter
          runs={filteredDataset.filteredRuns}
          events={filteredDataset.filteredLiveEvents}
          onRetryScan={onTriggerScan}
          isScanning={isScanning}
        />
      )}

      {/* 5. Modals: Saved Views Preset Manager & Data Drill-Down Inspector */}
      <SavedViewsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        currentFilters={filters}
        savedViews={savedViews}
        onSaveView={handleSaveView}
        onDeleteView={handleDeleteView}
        onLoadView={handleLoadView}
      />

      <DataDrillDownModal
        target={drillDownTarget}
        onClose={() => setDrillDownTarget(null)}
        onInspectItem={onInspectItem}
      />
    </div>
  );
};
