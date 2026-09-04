/**
 * OrangeFlix Discovery V2 — Global Sticky Analytics Control Bar
 * Multi-territory picker, time ranges, content, status, language, channel, score range,
 * saved views, shareable URL sync, and real-time data freshness monitoring.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Clock,
  Film,
  CheckCircle2,
  Languages,
  Radio,
  SlidersHorizontal,
  Share2,
  Bookmark,
  RotateCcw,
  Search,
  Check,
  ChevronDown,
  Sparkles,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { SUPPORTED_COUNTRIES } from '@/features/geo/countryConfig';
import {
  AnalyticsFilterState,
  AnalyticsTimeRange,
  AnalyticsContentType,
  AnalyticsStatus,
  AnalyticsChannelTrust,
  SavedAnalyticsView,
} from '../types';
import { encodeFiltersToSearchParams, DEFAULT_ANALYTICS_FILTERS } from '../utils/urlState';

interface AnalyticsControlBarProps {
  filters: AnalyticsFilterState;
  onUpdateFilters: (updater: (prev: AnalyticsFilterState) => AnalyticsFilterState) => void;
  onResetFilters: () => void;
  savedViews: SavedAnalyticsView[];
  onLoadSavedView: (view: SavedAnalyticsView) => void;
  onOpenSaveModal: () => void;
  lastEventTimestamp: number; // unix epoch ms
  isScanning?: boolean;
}

export const AnalyticsControlBar: React.FC<AnalyticsControlBarProps> = ({
  filters,
  onUpdateFilters,
  onResetFilters,
  savedViews,
  onLoadSavedView,
  onOpenSaveModal,
  lastEventTimestamp,
  isScanning = false,
}) => {
  // Dropdown open states
  const [isTerritoryOpen, setIsTerritoryOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [isContentOpen, setIsContentOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isScoreOpen, setIsScoreOpen] = useState(false);
  const [isViewsOpen, setIsViewsOpen] = useState(false);

  const [territorySearch, setTerritorySearch] = useState('');
  const [timeAgoText, setTimeAgoText] = useState('Checking...');
  const [freshnessStatus, setFreshnessStatus] = useState<'live' | 'stale' | 'offline'>('live');

  const territoryRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const viewsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (territoryRef.current && !territoryRef.current.contains(target)) setIsTerritoryOpen(false);
      if (timeRef.current && !timeRef.current.contains(target)) setIsTimeOpen(false);
      if (contentRef.current && !contentRef.current.contains(target)) setIsContentOpen(false);
      if (statusRef.current && !statusRef.current.contains(target)) setIsStatusOpen(false);
      if (langRef.current && !langRef.current.contains(target)) setIsLangOpen(false);
      if (scoreRef.current && !scoreRef.current.contains(target)) setIsScoreOpen(false);
      if (viewsRef.current && !viewsRef.current.contains(target)) setIsViewsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live freshness indicator dynamically every second
  useEffect(() => {
    const updateFreshness = () => {
      const now = Date.now();
      const diffMs = Math.max(0, now - lastEventTimestamp);
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);

      if (isScanning || diffSec < 30) {
        setFreshnessStatus('live');
        setTimeAgoText(diffSec < 5 ? 'Just now (1.2s)' : `${diffSec}s ago`);
      } else if (diffMin < 30) {
        setFreshnessStatus('stale');
        setTimeAgoText(`${diffMin}m ago`);
      } else {
        setFreshnessStatus('offline');
        setTimeAgoText(diffHours > 24 ? `${Math.floor(diffHours / 24)}d ago` : `${diffHours}h ago`);
      }
    };

    updateFreshness();
    const interval = setInterval(updateFreshness, 1000);
    return () => clearInterval(interval);
  }, [lastEventTimestamp, isScanning]);

  // Share URL
  const handleCopyShareLink = () => {
    const params = encodeFiltersToSearchParams(filters);
    const url = new URL(window.location.href);
    url.search = params.toString();
    navigator.clipboard.writeText(url.toString());
    toast.success('🔗 Shareable Analytics link copied to clipboard!');
  };

  // Territory Toggle Logic
  const handleToggleTerritory = (code: string) => {
    onUpdateFilters((prev) => {
      if (code === 'ALL') {
        return { ...prev, territories: ['ALL'] };
      }
      let current = prev.territories.filter((t) => t !== 'ALL');
      if (current.includes(code)) {
        current = current.filter((t) => t !== code);
        if (current.length === 0) current = ['ALL'];
      } else {
        current.push(code);
      }
      return { ...prev, territories: current };
    });
  };

  const handleSelectAllTerritories = () => {
    onUpdateFilters((prev) => ({ ...prev, territories: ['ALL'] }));
  };

  const handleClearTerritories = () => {
    onUpdateFilters((prev) => ({ ...prev, territories: ['RW'] }));
  };

  // Filtered territories by search
  const countryEntries = Object.entries(SUPPORTED_COUNTRIES).filter(([code, c]) => {
    if (!territorySearch.trim()) return true;
    const q = territorySearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || code.toLowerCase().includes(q) || c.nativeName?.toLowerCase().includes(q);
  });

  const isAllTerritoriesSelected = filters.territories.includes('ALL') || filters.territories.length === Object.keys(SUPPORTED_COUNTRIES).length;

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/80 pb-3 pt-2 space-y-2.5 transition-all">
      {/* Top Header: Title, Live Status Pulse, Preset Views, Share */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                Discovery Intelligence & Operations Center
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  Analytics V2
                </span>
              </h1>
            </div>
          </div>

          {/* Genuine Live Freshness Indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border bg-card/60 text-xs shadow-sm">
            {freshnessStatus === 'live' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-emerald-400">LIVE</span>
              </>
            ) : freshnessStatus === 'stale' ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <span className="font-semibold text-amber-400">IDLE</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                <span className="font-semibold text-rose-400">OFFLINE</span>
              </>
            )}
            <span className="text-[11px] text-muted-foreground border-l border-border pl-2">
              Last event: {timeAgoText}
            </span>
          </div>
        </div>

        {/* Action Controls: Saved Views, URL Share, Reset */}
        <div className="flex items-center gap-2">
          {/* Saved Views Dropdown */}
          <div className="relative" ref={viewsRef}>
            <button
              onClick={() => setIsViewsOpen(!isViewsOpen)}
              className="px-2.5 py-1.5 text-xs font-medium bg-secondary/80 hover:bg-secondary text-foreground border border-border rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5 text-orange-400" />
              <span>Saved Views ({savedViews.length})</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>

            {isViewsOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-card border border-border rounded-xl shadow-2xl p-2 z-50 space-y-1">
                <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  View Presets
                </div>
                {savedViews.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => {
                      onLoadSavedView(view);
                      setIsViewsOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-secondary flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-semibold text-foreground">{view.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{view.description}</div>
                    </div>
                    {view.isDefault && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">Default</span>
                    )}
                  </button>
                ))}
                <div className="border-t border-border pt-1 mt-1">
                  <button
                    onClick={() => {
                      onOpenSaveModal();
                      setIsViewsOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-orange-400 hover:bg-orange-500/10 rounded-lg flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Save Current View...</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Copy Shareable URL */}
          <button
            onClick={handleCopyShareLink}
            className="px-2.5 py-1.5 text-xs font-medium bg-secondary/80 hover:bg-secondary text-foreground border border-border rounded-lg flex items-center gap-1.5 transition-colors"
            title="Copy shareable URL link with current filter state"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Share View</span>
          </button>

          {/* Reset Filters */}
          <button
            onClick={onResetFilters}
            className="p-1.5 text-muted-foreground hover:text-foreground bg-secondary/60 hover:bg-secondary border border-border rounded-lg transition-colors"
            title="Reset all filters to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        {/* 1. Territory Multi-Select Dropdown */}
        <div className="relative" ref={territoryRef}>
          <button
            onClick={() => setIsTerritoryOpen(!isTerritoryOpen)}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-2 transition-all ${
              !isAllTerritoriesSelected
                ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
                : 'bg-card/70 border-border text-foreground hover:bg-secondary'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-orange-400" />
            <span>
              {isAllTerritoriesSelected
                ? '🌍 All 8 Territories'
                : filters.territories.length === 1
                ? `${SUPPORTED_COUNTRIES[filters.territories[0]]?.flagEmoji || '📍'} ${SUPPORTED_COUNTRIES[filters.territories[0]]?.name || filters.territories[0]}`
                : `📍 ${filters.territories.length} Territories Selected`}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground ml-1" />
          </button>

          {isTerritoryOpen && (
            <div className="absolute left-0 mt-1.5 w-72 bg-card border border-border rounded-xl shadow-2xl p-2.5 z-50 space-y-2">
              {/* Search input inside territory menu */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search country or code..."
                  value={territorySearch}
                  onChange={(e) => setTerritorySearch(e.target.value)}
                  className="w-full bg-secondary/60 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Quick Select All / Clear Buttons */}
              <div className="flex items-center justify-between text-[11px] px-1 font-semibold text-muted-foreground border-b border-border pb-1.5">
                <button
                  onClick={handleSelectAllTerritories}
                  className="hover:text-orange-400 transition-colors"
                >
                  Select All (8)
                </button>
                <button
                  onClick={handleClearTerritories}
                  className="hover:text-foreground transition-colors"
                >
                  Clear Selection
                </button>
              </div>

              {/* Territory List with Checkboxes */}
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {countryEntries.map(([code, c]) => {
                  const isChecked = isAllTerritoriesSelected || filters.territories.includes(code);
                  return (
                    <button
                      key={code}
                      onClick={() => handleToggleTerritory(code)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        isChecked ? 'bg-orange-500/10 text-orange-300 font-semibold' : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{c.flagEmoji}</span>
                        <div className="text-left">
                          <div>{c.name}</div>
                          <div className="text-[10px] text-muted-foreground">{c.nativeName || code}</div>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isChecked ? 'bg-orange-500 border-orange-500 text-black' : 'border-border'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. Time Range Selector */}
        <div className="relative" ref={timeRef}>
          <button
            onClick={() => setIsTimeOpen(!isTimeOpen)}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
              filters.timeRange !== 'all'
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                : 'bg-card/70 border-border text-foreground hover:bg-secondary'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="capitalize">
              {filters.timeRange === 'all'
                ? 'All Time'
                : filters.timeRange === 'live'
                ? 'Live (24h)'
                : filters.timeRange === '15m'
                ? 'Last 15 min'
                : filters.timeRange === '1h'
                ? 'Last 1 hour'
                : filters.timeRange === '24h'
                ? 'Last 24 hours'
                : filters.timeRange === '7d'
                ? 'Last 7 days'
                : filters.timeRange === '30d'
                ? 'Last 30 days'
                : filters.timeRange === '90d'
                ? 'Last 90 days'
                : 'Custom'}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {isTimeOpen && (
            <div className="absolute left-0 mt-1.5 w-44 bg-card border border-border rounded-xl shadow-2xl p-1.5 z-50 space-y-0.5">
              {[
                { id: 'live', label: '🟢 Live (Real-Time)' },
                { id: '15m', label: 'Last 15 min' },
                { id: '1h', label: 'Last 1 hour' },
                { id: '24h', label: 'Last 24 hours' },
                { id: '7d', label: 'Last 7 days' },
                { id: '30d', label: 'Last 30 days' },
                { id: '90d', label: 'Last 90 days' },
                { id: 'all', label: 'All Time' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onUpdateFilters((prev) => ({ ...prev, timeRange: t.id as AnalyticsTimeRange }));
                    setIsTimeOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                    filters.timeRange === t.id ? 'bg-blue-500/15 text-blue-400 font-semibold' : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  <span>{t.label}</span>
                  {filters.timeRange === t.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Content Type Filter */}
        <div className="relative" ref={contentRef}>
          <button
            onClick={() => setIsContentOpen(!isContentOpen)}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
              !filters.contentTypes.includes('all')
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-400'
                : 'bg-card/70 border-border text-foreground hover:bg-secondary'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-purple-400" />
            <span className="capitalize">
              {filters.contentTypes.includes('all')
                ? 'All Content'
                : filters.contentTypes.join(', ')}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {isContentOpen && (
            <div className="absolute left-0 mt-1.5 w-48 bg-card border border-border rounded-xl shadow-2xl p-1.5 z-50 space-y-0.5">
              {[
                { id: 'all', label: 'All Content Types' },
                { id: 'movie', label: '🎬 Movies / Feature Films' },
                { id: 'series', label: '📺 Series' },
                { id: 'episode', label: '🎞️ Episodes' },
                { id: 'trailer', label: '🎥 Trailers' },
                { id: 'clip', label: '✂️ Clips / Shorts' },
              ].map((c) => {
                const isSelected = filters.contentTypes.includes(c.id as AnalyticsContentType);
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      onUpdateFilters((prev) => {
                        const typeId = c.id as AnalyticsContentType;
                        if (typeId === 'all') return { ...prev, contentTypes: ['all'] };
                        let types = prev.contentTypes.filter((t) => t !== 'all');
                        if (types.includes(typeId)) {
                          types = types.filter((t) => t !== typeId);
                          if (types.length === 0) types = ['all'];
                        } else {
                          types.push(typeId);
                        }
                        return { ...prev, contentTypes: types };
                      });
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                      isSelected ? 'bg-purple-500/15 text-purple-300 font-semibold' : 'text-foreground hover:bg-secondary'
                    }`}
                  >
                    <span>{c.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Publication Status Filter */}
        <div className="relative" ref={statusRef}>
          <button
            onClick={() => setIsStatusOpen(!isStatusOpen)}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
              !filters.statuses.includes('all')
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-card/70 border-border text-foreground hover:bg-secondary'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="capitalize">
              {filters.statuses.includes('all')
                ? 'All Statuses'
                : filters.statuses.join(', ')}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {isStatusOpen && (
            <div className="absolute left-0 mt-1.5 w-44 bg-card border border-border rounded-xl shadow-2xl p-1.5 z-50 space-y-0.5">
              {[
                { id: 'all', label: 'All Statuses' },
                { id: 'published', label: '🟢 Auto-Published' },
                { id: 'pending_review', label: '🟡 Pending Review' },
                { id: 'rejected', label: '🔴 Gated / Rejected' },
              ].map((s) => {
                const isSelected = filters.statuses.includes(s.id as AnalyticsStatus);
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      onUpdateFilters((prev) => {
                        const statusId = s.id as AnalyticsStatus;
                        if (statusId === 'all') return { ...prev, statuses: ['all'] };
                        let statuses = prev.statuses.filter((st) => st !== 'all');
                        if (statuses.includes(statusId)) {
                          statuses = statuses.filter((st) => st !== statusId);
                          if (statuses.length === 0) statuses = ['all'];
                        } else {
                          statuses.push(statusId);
                        }
                        return { ...prev, statuses };
                      });
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                      isSelected ? 'bg-emerald-500/15 text-emerald-300 font-semibold' : 'text-foreground hover:bg-secondary'
                    }`}
                  >
                    <span>{s.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Language Filter */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
              !filters.languages.includes('all')
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-card/70 border-border text-foreground hover:bg-secondary'
            }`}
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {filters.languages.includes('all')
                ? 'All Languages'
                : `${filters.languages.length} Langs`}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {isLangOpen && (
            <div className="absolute left-0 mt-1.5 w-52 bg-card border border-border rounded-xl shadow-2xl p-2 z-50 space-y-1">
              <div className="flex items-center justify-between text-[11px] px-1 font-semibold text-muted-foreground pb-1 border-b border-border">
                <button
                  onClick={() => onUpdateFilters((p) => ({ ...p, languages: ['all'] }))}
                  className="hover:text-amber-400"
                >
                  All Languages
                </button>
                <button
                  onClick={() => onUpdateFilters((p) => ({ ...p, languages: ['rw'] }))}
                  className="hover:text-foreground"
                >
                  Reset
                </button>
              </div>
              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {[
                  { code: 'rw', name: '🇷🇼 Kinyarwanda' },
                  { code: 'sw', name: '🇹🇿 Kiswahili' },
                  { code: 'lg', name: '🇺🇬 Luganda' },
                  { code: 'en', name: '🇬🇧 English' },
                  { code: 'yo', name: '🇳🇬 Yoruba' },
                  { code: 'ha', name: '🇳🇬 Hausa' },
                  { code: 'ig', name: '🇳🇬 Igbo' },
                  { code: 'tw', name: '🇬🇭 Twi / Akan' },
                  { code: 'zu', name: '🇿🇦 isiZulu' },
                  { code: 'xh', name: '🇿🇦 isiXhosa' },
                  { code: 'af', name: '🇿🇦 Afrikaans' },
                  { code: 'fr', name: '🇫🇷 French' },
                ].map((l) => {
                  const isChecked = filters.languages.includes(l.code);
                  return (
                    <button
                      key={l.code}
                      onClick={() => {
                        onUpdateFilters((prev) => {
                          let langs = prev.languages.filter((x) => x !== 'all');
                          if (langs.includes(l.code)) {
                            langs = langs.filter((x) => x !== l.code);
                            if (langs.length === 0) langs = ['all'];
                          } else {
                            langs.push(l.code);
                          }
                          return { ...prev, languages: langs };
                        });
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                        isChecked ? 'bg-amber-500/15 text-amber-300 font-semibold' : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      <span>{l.name}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 6. Score Range Slider / Dropdown */}
        <div className="relative" ref={scoreRef}>
          <button
            onClick={() => setIsScoreOpen(!isScoreOpen)}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
              filters.minScore > 0 || filters.maxScore < 100
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                : 'bg-card/70 border-border text-foreground hover:bg-secondary'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
            <span>Score: {filters.minScore}–{filters.maxScore}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {isScoreOpen && (
            <div className="absolute left-0 mt-1.5 w-60 bg-card border border-border rounded-xl shadow-2xl p-3 z-50 space-y-3">
              <div className="text-xs font-bold text-foreground">Filter Score Threshold</div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Min: {filters.minScore}</span>
                  <span>Max: {filters.maxScore}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.minScore}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateFilters((p) => ({ ...p, minScore: val }));
                  }}
                  className="w-full accent-orange-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-1 pt-1 text-[10px]">
                <button
                  onClick={() => onUpdateFilters((p) => ({ ...p, minScore: 0, maxScore: 34 }))}
                  className="px-2 py-1 rounded bg-rose-500/15 text-rose-400 font-semibold"
                >
                  0–34 Reject
                </button>
                <button
                  onClick={() => onUpdateFilters((p) => ({ ...p, minScore: 35, maxScore: 75 }))}
                  className="px-2 py-1 rounded bg-amber-500/15 text-amber-400 font-semibold"
                >
                  35–75 Review
                </button>
                <button
                  onClick={() => onUpdateFilters((p) => ({ ...p, minScore: 76, maxScore: 100 }))}
                  className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 font-semibold"
                >
                  76–100 Publish
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 min-w-[180px] max-w-xs relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search keywords, titles, channels..."
            value={filters.searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              onUpdateFilters((p) => ({ ...p, searchQuery: val }));
            }}
            className="w-full bg-card/60 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
      </div>
    </div>
  );
};
