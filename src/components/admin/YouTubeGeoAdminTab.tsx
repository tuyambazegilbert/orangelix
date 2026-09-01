/**
 * OrangeFlix Admin: YouTube Geo-Discovery Command Center Tab
 * Conforms strictly to Sections 1, 16, 17, 18, 19 specifications.
 * Features full search queries configuration, automatic channel uploads scanning, complete audit dialogs,
 * and comprehensive Multi-Select Bulk Operations for content moderation, trusted channels, and search queries.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GeoContentItem,
  TrustedChannel,
  GeoCountryConfig,
  GeoContentStatus,
  GeoContentType,
  DiscoverySummaryLog,
  DiscoveryStats,
  CustomCountryQuery,
} from '@/types/geo-content';
import { GeoContentService } from '@/services/geo-content-service';
import { YouTubeClient } from '@/features/youtube/client';
import { getAllCountries, getCountryConfig } from '@/features/geo/countryConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Youtube,
  Sparkles,
  CheckCircle,
  RefreshCw,
  Search,
  ExternalLink,
  Clock,
  Film,
  Check,
  X,
  Play,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Pause,
  Plus,
  Radio,
  Trash2,
  SlidersHorizontal,
  CheckSquare,
  Square,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Zap,
  PlayCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { AutoDiscoveryScheduler, AutoDiscoveryStatus } from '@/services/auto-discovery-scheduler';
import { getDiscoveryV2Profile, validateV2Profile } from '@/features/youtube/discoveryV2';

export default function YouTubeGeoAdminTab() {
  // V1 and V2 deliberately remain separate scan paths. Switching views never
  // changes the classifier used by a running discovery job.
  const [activeEngine, setActiveEngine] = useState<'v1' | 'v2'>('v1');
  const [v2RunMode, setV2RunMode] = useState<'manual' | 'incremental'>('incremental');
  const [countries] = useState<GeoCountryConfig[]>(() => getAllCountries());
  const [selectedCountry, setSelectedCountry] = useState<string>('RW');
  const [contentItems, setContentItems] = useState<GeoContentItem[]>([]);
  const [trustedChannels, setTrustedChannels] = useState<TrustedChannel[]>([]);
  const [countryQueries, setCountryQueries] = useState<CustomCountryQuery[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newChannelId, setNewChannelId] = useState('');
  const [newQueryText, setNewQueryText] = useState('');
  const [newQueryType, setNewQueryType] = useState<'movie' | 'series'>('movie');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isScanningChannel, setIsScanningChannel] = useState<string | null>(null);
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [selectedScanChannel, setSelectedScanChannel] = useState<TrustedChannel | null>(null);
  const [summaryLog, setSummaryLog] = useState<DiscoverySummaryLog | null>(null);
  const [activeSection, setActiveSection] = useState<'content' | 'channels' | 'queries'>('content');

  // Automated 3x-Weekly Discovery Scheduler State
  const [schedulerStatus, setSchedulerStatus] = useState<AutoDiscoveryStatus>(() =>
    AutoDiscoveryScheduler.getStatus()
  );
  const [isTriggeringScheduler, setIsTriggeringScheduler] = useState(false);
  const [schedulerProgress, setSchedulerProgress] = useState<string | null>(null);

  // Multi-Select States
  const [selectedContentIds, setSelectedContentIds] = useState<Set<string>>(new Set());
  const [selectedChannelIds, setSelectedChannelIds] = useState<Set<string>>(new Set());
  const [selectedQueryIds, setSelectedQueryIds] = useState<Set<string>>(new Set());

  // Discovery V2 States
  const [isRunningV2Discovery, setIsRunningV2Discovery] = useState(false);
  const [isReprocessingV2, setIsReprocessingV2] = useState(false);
  const [v2DiscoveryResult, setV2DiscoveryResult] = useState<Record<string, unknown> | null>(null);
  const [v2CacheStats, setV2CacheStats] = useState<Record<string, unknown> | null>(null);
  const [showV2Comparison, setShowV2Comparison] = useState(false);
  const [activeV2Section, setActiveV2Section] = useState<'discovery' | 'comparison' | 'series'>('discovery');

  const [stats, setStats] = useState({
    totalDiscovered: 0,
    publishedMovies: 0,
    pendingReview: 0,
    rejectedCount: 0,
    totalChannels: 0,
    countriesCount: 0,
  });

  const country = getCountryConfig(selectedCountry);
  const hasApiKey = YouTubeClient.hasApiKey();
  const v2ProfileWarnings = activeEngine === 'v2'
    ? validateV2Profile(getDiscoveryV2Profile(selectedCountry, country as unknown as Parameters<typeof getDiscoveryV2Profile>[1]))
    : [];

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [contentRes, channels, adminStats, queries] = await Promise.all([
        GeoContentService.getMoviesByCountry({
          countryCode: selectedCountry,
          status: statusFilter === 'all' ? 'all' : (statusFilter as GeoContentStatus),
          searchQuery: searchQuery.trim() || undefined,
          limit: 150,
        }),
        GeoContentService.getTrustedChannels(selectedCountry),
        GeoContentService.getAdminStats(),
        GeoContentService.getCountryQueries(selectedCountry),
      ]);

      setContentItems(contentRes.items);
      setTrustedChannels(channels);
      setCountryQueries(queries);
      setStats(adminStats);
      setSummaryLog(GeoContentService.getDiscoverySummary(selectedCountry));
    } catch (err) {
      console.error('Failed to load YouTube Geo admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Reset selection sets on country/filter change
    setSelectedContentIds(new Set());
    setSelectedChannelIds(new Set());
    setSelectedQueryIds(new Set());
    void loadData();
  }, [selectedCountry, statusFilter, searchQuery]);

  const handleSyncDiscovery = async (countryCode: string) => {
    setIsSyncing(true);
    toast.info(`Running YouTube discovery worker for ${countryCode}...`);
    try {
      const res = await GeoContentService.triggerDiscoverySync(countryCode);
      setSummaryLog(res.summaryLog);
      if (res.apiError) {
        toast.error(`Discovery error: ${res.apiError}`);
      } else {
        toast.success(
          `Discovery completed for ${countryCode}! Discovered ${res.stats.uniqueVideos} unique videos (${res.stats.publishedMovies} published movies, ${res.stats.publishedSeries} published series, ${res.stats.pendingChannels} pending channels).`
        );
      }
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Discovery sync failed.';
      toast.error(msg);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: GeoContentStatus,
    isFullMovieCandidate?: boolean,
    classification?: GeoContentType
  ) => {
    await GeoContentService.updateContentStatus(id, status, isFullMovieCandidate, classification);
    toast.success(`Content status updated: ${status}`);
    await loadData();
  };

  const handleApproveChannel = async (channelId: string) => {
    setIsScanningChannel(channelId);
    toast.info(`Approving channel and scanning uploads...`);
    try {
      const scanStats = await GeoContentService.approveChannel(channelId);
      if (scanStats && scanStats.status === 'success') {
        toast.success(
          `Channel Approved & Scanned! Fetched: ${scanStats.fetched}, Qualifying: ${scanStats.qualifying}, Indexed: ${scanStats.indexed}, Published: ${scanStats.published}`
        );
      } else {
        toast.success('Channel Approved! Auto-scanned uploads and published qualifying movies.');
      }
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      toast.error(msg);
    } finally {
      setIsScanningChannel(null);
    }
  };

  const handleRejectChannel = async (channelId: string) => {
    await GeoContentService.rejectChannel(channelId);
    toast.error('Channel marked as Rejected (excluded from discovery)');
    await loadData();
  };

  const handlePauseChannel = async (channelId: string) => {
    await GeoContentService.pauseChannel(channelId);
    toast.info('Channel marked as Pending');
    await loadData();
  };

  const handleScanChannel = async (channelId: string) => {
    setIsScanningChannel(channelId);
    toast.info(`Scanning uploads feed for channel ${channelId}...`);
    try {
      const scanStats = await GeoContentService.scanChannelUploads(channelId);
      if (scanStats.status === 'failed') {
        toast.error(`Channel scan failed: ${scanStats.errorMessage || 'Unknown error'}`);
      } else {
        toast.success(
          `Channel scan complete! Fetched: ${scanStats.fetched}, Qualifying: ${scanStats.qualifying}, Indexed: ${scanStats.indexed}, Published: ${scanStats.published}, Skipped: ${scanStats.skipped}`
        );
      }
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Channel scan failed';
      toast.error(msg);
    } finally {
      setIsScanningChannel(null);
    }
  };

  const handleScanAllChannels = async () => {
    setIsBatchScanning(true);
    toast.info(`Scanning all approved channels for ${country.name}...`);
    try {
      const res = await GeoContentService.scanAllApprovedChannels(selectedCountry);
      toast.success(
        `Batch scan complete! Scanned ${res.totalScanned} channels: ${res.totalIndexed} indexed, ${res.totalPublished} published.`
      );
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Batch scan failed';
      toast.error(msg);
    } finally {
      setIsBatchScanning(false);
    }
  };

  const handleTriggerAutoDiscovery = async () => {
    setIsTriggeringScheduler(true);
    setSchedulerProgress('Initializing 3x-weekly multi-country scan...');
    toast.info('Starting 3x-Weekly Cinema Discovery across all territories...');
    try {
      const log = await AutoDiscoveryScheduler.runMultiCountryAutoDiscovery('admin_manual', (code, step, total) => {
        setSchedulerProgress(`Scanning ${code} (${step}/${total} countries)...`);
      });
      setSchedulerStatus(AutoDiscoveryScheduler.getStatus());
      toast.success(
        `3x-Weekly Discovery Complete! Discovered ${log.totalUniqueVideos} videos: ${log.totalNewMovies} new movies, ${log.totalNewSeries} new series across ${log.countriesScanned.length} countries.`
      );
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Auto-discovery scan failed';
      toast.error(msg);
    } finally {
      setIsTriggeringScheduler(false);
      setSchedulerProgress(null);
    }
  };

  const handleToggleAutoDiscoveryEnabled = (enabled: boolean) => {
    AutoDiscoveryScheduler.updateConfig({ isEnabled: enabled });
    setSchedulerStatus(AutoDiscoveryScheduler.getStatus());
    toast.success(`Automated 3x-weekly discovery schedule ${enabled ? 'Enabled (Mon, Wed, Fri)' : 'Paused'}.`);
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelId.trim()) return;

    toast.info(`Looking up channel ${newChannelId.trim()}...`);
    const meta = await YouTubeClient.getChannelMetadata(newChannelId.trim());

    await GeoContentService.addChannel({
      channelId: newChannelId.trim(),
      channelTitle: meta?.channelTitle || newChannelId.trim(),
      country: selectedCountry,
      trust: 'approved',
      autoPublishMovies: true,
      autoPublishSeries: true,
      notes: meta?.description || 'Added by administrator',
    });

    toast.success(`Channel "${meta?.channelTitle || newChannelId.trim()}" added to trusted list!`);
    setNewChannelId('');
    await loadData();
  };

  const handleAddCustomQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQueryText.trim()) return;

    await GeoContentService.addCustomQuery(selectedCountry, newQueryText.trim(), newQueryType);
    toast.success(`Search query "${newQueryText.trim()}" added for ${country.name}!`);
    setNewQueryText('');
    await loadData();
  };

  const handleToggleQuery = async (id: string, enabled: boolean) => {
    await GeoContentService.toggleCustomQuery(id, enabled);
    await loadData();
  };

  const handleDeleteQuery = async (id: string) => {
    await GeoContentService.deleteCustomQuery(id);
    toast.info('Search query deleted.');
    await loadData();
  };

  const handleResetQueries = async () => {
    await GeoContentService.resetCountryQueriesToDefault(selectedCountry);
    toast.success(`Search queries reset to defaults for ${country.name}`);
    await loadData();
  };

  // ==========================================
  // MULTI-SELECT HANDLERS: CONTENT
  // ==========================================
  const toggleSelectAllContent = () => {
    if (selectedContentIds.size === contentItems.length) {
      setSelectedContentIds(new Set());
    } else {
      setSelectedContentIds(new Set(contentItems.map((i) => i.id)));
    }
  };

  const toggleSelectContent = (id: string) => {
    const next = new Set(selectedContentIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedContentIds(next);
  };

  const handleBulkPublishContent = async () => {
    if (selectedContentIds.size === 0) return;
    setIsProcessingBulk(true);
    const count = selectedContentIds.size;
    toast.info(`Publishing ${count} selected videos to public catalog...`);
    try {
      await GeoContentService.bulkUpdateContentStatus(
        Array.from(selectedContentIds),
        'published',
        true,
        'movie'
      );
      toast.success(`Successfully published ${count} videos!`);
      setSelectedContentIds(new Set());
      await loadData();
    } catch {
      toast.error('Bulk publish failed.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkRejectContent = async () => {
    if (selectedContentIds.size === 0) return;
    setIsProcessingBulk(true);
    const count = selectedContentIds.size;
    toast.info(`Rejecting ${count} selected videos...`);
    try {
      await GeoContentService.bulkUpdateContentStatus(
        Array.from(selectedContentIds),
        'rejected',
        false
      );
      toast.success(`Rejected ${count} videos.`);
      setSelectedContentIds(new Set());
      await loadData();
    } catch {
      toast.error('Bulk reject failed.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkReclassifyContent = async (type: GeoContentType) => {
    if (selectedContentIds.size === 0) return;
    setIsProcessingBulk(true);
    const count = selectedContentIds.size;
    try {
      await GeoContentService.bulkUpdateContentStatus(
        Array.from(selectedContentIds),
        'published',
        type === 'movie',
        type
      );
      toast.success(`Reclassified ${count} items as ${type}.`);
      setSelectedContentIds(new Set());
      await loadData();
    } catch {
      toast.error('Bulk reclassify failed.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkDeleteContent = async () => {
    if (selectedContentIds.size === 0) return;
    if (!confirm(`Are you sure you want to remove ${selectedContentIds.size} items from the indexed catalog?`)) return;
    setIsProcessingBulk(true);
    const count = selectedContentIds.size;
    try {
      await GeoContentService.bulkDeleteContent(Array.from(selectedContentIds));
      toast.success(`Removed ${count} items from catalog.`);
      setSelectedContentIds(new Set());
      await loadData();
    } catch {
      toast.error('Bulk delete failed.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // ==========================================
  // MULTI-SELECT HANDLERS: CHANNELS
  // ==========================================
  const toggleSelectAllChannels = () => {
    if (selectedChannelIds.size === trustedChannels.length) {
      setSelectedChannelIds(new Set());
    } else {
      setSelectedChannelIds(new Set(trustedChannels.map((c) => c.channelId)));
    }
  };

  const toggleSelectChannel = (id: string) => {
    const next = new Set(selectedChannelIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedChannelIds(next);
  };

  const handleBulkApproveChannels = async () => {
    if (selectedChannelIds.size === 0) return;
    setIsProcessingBulk(true);
    const count = selectedChannelIds.size;
    toast.info(`Approving and scanning ${count} selected channels...`);
    try {
      for (const id of Array.from(selectedChannelIds)) {
        await GeoContentService.approveChannel(id);
      }
      toast.success(`Approved and scanned ${count} channels!`);
      setSelectedChannelIds(new Set());
      await loadData();
    } catch {
      toast.error('Bulk approval failed.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkRejectChannels = async () => {
    if (selectedChannelIds.size === 0) return;
    setIsProcessingBulk(true);
    const count = selectedChannelIds.size;
    try {
      await GeoContentService.bulkRejectChannels(Array.from(selectedChannelIds));
      toast.success(`Marked ${count} channels as rejected.`);
      setSelectedChannelIds(new Set());
      await loadData();
    } catch {
      toast.error('Bulk reject channels failed.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkPauseChannels = async () => {
    if (selectedChannelIds.size === 0) return;
    setIsProcessingBulk(true);
    const count = selectedChannelIds.size;
    try {
      await GeoContentService.bulkPauseChannels(Array.from(selectedChannelIds));
      toast.info(`Marked ${count} channels as pending.`);
      setSelectedChannelIds(new Set());
      await loadData();
    } catch {
      toast.error('Bulk pause channels failed.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkScanSelectedChannels = async () => {
    if (selectedChannelIds.size === 0) return;
    setIsProcessingBulk(true);
    const count = selectedChannelIds.size;
    toast.info(`Scanning upload feeds for ${count} selected channels...`);
    try {
      let totalIndexed = 0;
      let totalPublished = 0;
      for (const id of Array.from(selectedChannelIds)) {
        const stats = await GeoContentService.scanChannelUploads(id);
        totalIndexed += stats.indexed;
        totalPublished += stats.published;
      }
      toast.success(`Bulk scan finished: ${totalIndexed} qualifying indexed, ${totalPublished} published.`);
      setSelectedChannelIds(new Set());
      await loadData();
    } catch {
      toast.error('Bulk scan failed.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkToggleAutoPublish = async (enabled: boolean) => {
    if (selectedChannelIds.size === 0) return;
    setIsProcessingBulk(true);
    const count = selectedChannelIds.size;
    try {
      await GeoContentService.bulkToggleChannelAutoPublish(Array.from(selectedChannelIds), enabled);
      toast.success(`Set auto-publish to ${enabled ? 'Enabled' : 'Disabled'} on ${count} channels.`);
      setSelectedChannelIds(new Set());
      await loadData();
    } catch {
      toast.error('Bulk toggle auto-publish failed.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // ==========================================
  // MULTI-SELECT HANDLERS: QUERIES
  // ==========================================
  const toggleSelectAllQueries = () => {
    if (selectedQueryIds.size === countryQueries.length) {
      setSelectedQueryIds(new Set());
    } else {
      setSelectedQueryIds(new Set(countryQueries.map((q) => q.id)));
    }
  };

  const toggleSelectQuery = (id: string) => {
    const next = new Set(selectedQueryIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedQueryIds(next);
  };

  const handleBulkToggleQueries = async (enabled: boolean) => {
    if (selectedQueryIds.size === 0) return;
    setIsProcessingBulk(true);
    const count = selectedQueryIds.size;
    try {
      await GeoContentService.bulkToggleCustomQueries(Array.from(selectedQueryIds), enabled);
      toast.success(`Updated ${count} search queries to ${enabled ? 'Enabled' : 'Disabled'}.`);
      setSelectedQueryIds(new Set());
      await loadData();
    } catch {
      toast.error('Bulk toggle queries failed.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkDeleteQueries = async () => {
    if (selectedQueryIds.size === 0) return;
    setIsProcessingBulk(true);
    const customIdsToDelete = countryQueries
      .filter((q) => selectedQueryIds.has(q.id) && !q.isDefault)
      .map((q) => q.id);

    if (customIdsToDelete.length === 0) {
      toast.info('System default queries cannot be deleted. You can disable them instead.');
      setIsProcessingBulk(false);
      return;
    }

    try {
      await GeoContentService.bulkDeleteCustomQueries(customIdsToDelete);
      toast.success(`Deleted ${customIdsToDelete.length} custom search queries.`);
      setSelectedQueryIds(new Set());
      await loadData();
    } catch {
      toast.error('Bulk delete queries failed.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const discStats: DiscoveryStats | undefined = summaryLog?.stats;

  // V2 Discovery Handler
  const handleRunV2Discovery = async () => {
    setIsRunningV2Discovery(true);
    toast.info(`Running Discovery V2 for ${country.name}...`);
    try {
      // Import V2 discovery engine
      const { runDiscoveryV2 } = await import('@/features/youtube/discoveryV2');
      
      // Run discovery with dry-run for testing
      const result = await runDiscoveryV2(
        selectedCountry,
        country as unknown as Parameters<typeof runDiscoveryV2>[1],
        v2RunMode,
        {
          maxQueries: 20,
          skipCache: false,
          dryRun: false,
        }
      );
      
      setV2DiscoveryResult({
        ...result,
        cacheHitRate: result.queriesExecuted
          ? Math.round((result.cacheHits / result.queriesExecuted) * 100)
          : 0,
        seriesCount: result.seriesFound,
      });
      setShowV2Comparison(true);
      setActiveV2Section('discovery');
      
      toast.success(
        `V2 Discovery Complete! Published: ${result.published}, Pending: ${result.pendingReview}, Rejected: ${result.rejected}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'V2 Discovery failed';
      console.error('V2 Discovery error:', err);
      toast.error(`V2 Discovery Error: ${msg}`);
    } finally {
      setIsRunningV2Discovery(false);
    }
  };

  const handleReprocessV2 = async () => {
    setIsReprocessingV2(true);
    try {
      const { reprocessDiscoveryV2 } = await import('@/features/youtube/discoveryV2');
      const count = await reprocessDiscoveryV2(selectedCountry, country as unknown as Parameters<typeof reprocessDiscoveryV2>[1]);
      toast.success(`Reprocessed ${count} stored ${country.name} records without calling YouTube.`);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'V2 reprocessing failed');
    } finally {
      setIsReprocessingV2(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Engine navigation: each button activates an independent scan pipeline. */}
      <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-xl">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">YouTube Discovery Engine</p>
            <p className="text-xs text-gray-400 mt-1">
              {activeEngine === 'v1'
                ? 'V1 uses the existing stateless discovery worker and legacy publication rules.'
                : 'V2 uses Firestore cache, locking, evidence scoring, and persistent series knowledge.'}
            </p>
          </div>
          <div className="inline-flex rounded-lg bg-gray-950 border border-gray-800 p-1">
            <Button
              size="sm"
              onClick={() => setActiveEngine('v1')}
              className={`text-xs ${activeEngine === 'v1' ? 'bg-orange-500 hover:bg-orange-500 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}
            >
              <Youtube className="w-3.5 h-3.5 mr-1.5" /> Discovery V1
            </Button>
            <Button
              size="sm"
              onClick={() => setActiveEngine('v2')}
              className={`text-xs ${activeEngine === 'v2' ? 'bg-violet-600 hover:bg-violet-600 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Discovery V2
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeEngine === 'v2' && (
        <Card className="bg-gradient-to-r from-violet-950/45 via-gray-900/90 to-blue-950/30 border-violet-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-400" /> Discovery V2 Control Center</CardTitle>
            <CardDescription className="text-xs text-gray-400">Persistent, incremental discovery. Only administrators run scans; public users read Firestore.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col lg:flex-row lg:items-center gap-3">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-full lg:w-[180px] bg-gray-950 border-gray-700 text-xs text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800 text-white">
                {countries.map((c) => <SelectItem key={c.countryCode} value={c.countryCode} className="text-xs">{c.flagEmoji} {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={v2RunMode} onValueChange={(value: 'manual' | 'incremental') => setV2RunMode(value)}>
              <SelectTrigger className="w-full lg:w-[190px] bg-gray-950 border-gray-700 text-xs text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800 text-white">
                <SelectItem value="incremental" className="text-xs">Incremental (cache-first)</SelectItem>
                <SelectItem value="manual" className="text-xs">Manual country scan</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRunV2Discovery} disabled={isRunningV2Discovery || !hasApiKey} className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold">
              <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${isRunningV2Discovery ? 'animate-spin' : ''}`} />
              {isRunningV2Discovery ? 'Running V2…' : `Run V2 for ${country.name}`}
            </Button>
            <Button onClick={handleReprocessV2} disabled={isReprocessingV2} variant="outline" className="bg-gray-950 border-gray-700 text-xs text-violet-300 hover:text-white">
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isReprocessingV2 ? 'animate-spin' : ''}`} />
              {isReprocessingV2 ? 'Reprocessing…' : 'Reprocess Stored'}
            </Button>
            {!hasApiKey && <p className="text-xs text-amber-400">A restricted VITE_YOUTUBE_API_KEY is required to scan.</p>}
            {v2ProfileWarnings.length > 0 && <p className="text-xs text-amber-400">V2 keyword profile warning: {v2ProfileWarnings.join(', ')}</p>}
          </CardContent>
        </Card>
      )}

      {/* Header Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900/60 border-gray-800 backdrop-blur-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Discovered</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.totalDiscovered}</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Stored in catalog cache</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 grid place-items-center text-red-400">
              <Youtube className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-gray-800 backdrop-blur-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Published Movies</p>
              <h3 className="text-2xl font-bold text-orange-400 mt-1">{stats.publishedMovies}</h3>
              <p className="text-[11px] text-emerald-400 mt-0.5">Live on public website</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 grid place-items-center text-orange-400">
              <Film className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-gray-800 backdrop-blur-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Review</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">{stats.pendingReview}</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Awaiting moderation</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 grid place-items-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-gray-800 backdrop-blur-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trusted Channels</p>
              <h3 className="text-2xl font-bold text-blue-400 mt-1">{trustedChannels.length}</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Approved production houses</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 grid place-items-center text-blue-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {activeEngine === 'v1' && <>
      {/* V1: existing 3x-weekly browser scheduler and legacy worker controls. */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-orange-950/40 via-gray-900/90 to-purple-950/30 border-orange-500/30 shadow-xl">
        <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-orange-500 text-white font-bold text-[10px]">
                <Zap className="w-3 h-3 mr-1" /> 3x / Week Automated Discovery
              </Badge>
              <Badge variant="outline" className={schedulerStatus.config.isEnabled ? 'border-emerald-500/50 text-emerald-400 text-[10px]' : 'border-gray-700 text-gray-400 text-[10px]'}>
                {schedulerStatus.config.isEnabled ? '🟢 Schedule Active (Mon, Wed, Fri • 04:00 UTC)' : '⚪ Schedule Paused'}
              </Badge>
            </div>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Automated Cinema Sync & Multi-Territory Indexing
            </h3>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Scans YouTube & cinema channels 3 times per week across Rwanda, Uganda, Kenya, Nigeria, Ghana, Tanzania, South Africa & international cinema to automatically discover, classify, and update your web catalog.
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
              <span>
                <strong>Last Run:</strong>{' '}
                {schedulerStatus.lastRunTimestamp
                  ? new Date(schedulerStatus.lastRunTimestamp).toLocaleString()
                  : 'Pending first automated run'}
              </span>
              <span>•</span>
              <span>
                <strong>Next Scheduled:</strong>{' '}
                {new Date(schedulerStatus.nextRunTimestamp).toLocaleString()}
              </span>
              {schedulerProgress && (
                <>
                  <span>•</span>
                  <span className="text-orange-400 font-semibold animate-pulse">
                    {schedulerProgress}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleToggleAutoDiscoveryEnabled(!schedulerStatus.config.isEnabled)}
              className="border-white/15 bg-white/[.04] text-xs text-slate-200 hover:bg-white/[.08] rounded-xl h-9"
            >
              {schedulerStatus.config.isEnabled ? (
                <>
                  <ToggleRight className="w-4 h-4 mr-1.5 text-emerald-400" /> Pause Schedule
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 mr-1.5 text-slate-400" /> Enable Schedule
                </>
              )}
            </Button>

            <Button
              onClick={handleTriggerAutoDiscovery}
              disabled={isTriggeringScheduler || isSyncing}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-lg shadow-orange-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isTriggeringScheduler ? 'animate-spin' : ''}`} />
              {isTriggeringScheduler ? 'Scanning All Territories...' : 'Trigger 3x-Weekly Scan Now'}
            </Button>
          </div>
        </div>
      </Card>

      {/* YouTube Cinema Discovery Control Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Discovery Worker Action Card */}
        <Card className="bg-gray-900/80 border-gray-800 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-500" />
                  YouTube Cinema Discovery
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  Automated multi-query search, deduplication, scoring & channel trust pipeline.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="w-[140px] bg-gray-950 border-gray-700 text-xs text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800 text-white">
                    {countries.map((c) => (
                      <SelectItem key={c.countryCode} value={c.countryCode} className="text-xs">
                        {c.flagEmoji} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => handleSyncDiscovery(selectedCountry)}
                  disabled={isSyncing}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 shadow-lg shadow-orange-500/20"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Discovering...' : `Discover ${country.name} Movies`}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-800/80">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSyncDiscovery(selectedCountry)}
                disabled={isSyncing}
                className="text-xs bg-gray-950 border-gray-800 text-gray-300 hover:text-white"
              >
                <RefreshCw className="w-3 h-3 mr-1.5 text-orange-400" /> Refresh {country.name}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setStatusFilter('pending_review');
                  setActiveSection('content');
                }}
                className="text-xs bg-gray-950 border-gray-800 text-amber-300 hover:text-white"
              >
                <Clock className="w-3 h-3 mr-1.5 text-amber-400" /> Review Pending ({stats.pendingReview})
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveSection('channels')}
                className="text-xs bg-gray-950 border-gray-800 text-blue-300 hover:text-white"
              >
                <CheckCircle className="w-3 h-3 mr-1.5 text-blue-400" /> Manage Trusted Channels ({trustedChannels.length})
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveSection('queries')}
                className="text-xs bg-gray-950 border-gray-800 text-violet-300 hover:text-white"
              >
                <SlidersHorizontal className="w-3 h-3 mr-1.5 text-violet-400" /> Search Queries ({countryQueries.length})
              </Button>
            </div>

            {/* Queries breakdown */}
            <div className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-orange-400" /> Active Configured Queries ({countryQueries.filter(q => q.enabled).length})
                </p>
                <button
                  onClick={() => setActiveSection('queries')}
                  className="text-[10px] text-orange-400 hover:underline font-medium"
                >
                  Configure Queries →
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {countryQueries.filter(q => q.enabled).map((q) => (
                  <Badge key={q.id} variant="secondary" className="bg-gray-900 text-gray-300 border border-white/5 text-[11px]">
                    ✓ {q.query}
                  </Badge>
                ))}
              </div>
            </div>

            {/* API Config Notification */}
            {!hasApiKey && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>YouTube Data API key is not configured in environment (VITE_YOUTUBE_API_KEY). Using server gateway mode.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Live Discovery Stats Card */}
        <Card className="bg-gray-900/80 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {country.name} Discovery Diagnostics
            </CardTitle>
            <CardDescription className="text-xs text-gray-400">
              {summaryLog?.lastDiscoveryAt ? `Last run: ${new Date(summaryLog.lastDiscoveryAt).toLocaleTimeString()}` : 'No sync run yet'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400">Unique Videos</span>
              <span className="font-bold text-orange-400 font-mono">{discStats?.uniqueVideos ?? contentItems.length}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400">Metadata Fetched</span>
              <span className="font-bold text-white font-mono">{discStats?.metadataFetched ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400">Movies Detected</span>
              <span className="font-bold text-emerald-400 font-mono">{discStats?.movies ?? contentItems.filter(i => i.classification === 'movie').length}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400">Episodes Detected</span>
              <span className="font-bold text-violet-400 font-mono">{discStats?.episodes ?? contentItems.filter(i => i.classification === 'episode').length}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400">Rejected / Shorts / Clips</span>
              <span className="font-bold text-rose-400 font-mono">{discStats?.rejected ?? '0'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400">Published Movies</span>
              <span className="font-bold text-orange-400 font-mono">{discStats?.publishedMovies ?? stats.publishedMovies}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400">Firestore Writes</span>
              <span className="font-bold text-cyan-400 font-mono">{discStats?.firestoreWrites ?? contentItems.length}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-gray-400">API Status</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Operational
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Navigation */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-800 pb-3">
        <Button
          size="sm"
          onClick={() => setActiveSection('content')}
          className={`text-xs font-semibold ${
            activeSection === 'content'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-900/60 text-gray-400 hover:text-white'
          }`}
        >
          <Film className="w-3.5 h-3.5 mr-1.5" />
          Content Moderation ({contentItems.length})
        </Button>

        <Button
          size="sm"
          onClick={() => setActiveSection('channels')}
          className={`text-xs font-semibold ${
            activeSection === 'channels'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-900/60 text-gray-400 hover:text-white'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
          Trusted Channels ({trustedChannels.length})
        </Button>

        <Button
          size="sm"
          onClick={() => setActiveSection('queries')}
          className={`text-xs font-semibold ${
            activeSection === 'queries'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-900/60 text-gray-400 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
          Search Queries Config ({countryQueries.length})
        </Button>

        <div className="flex-1" />

      </div>

      {/* SECTION 1: SEARCH QUERIES CONFIGURATION */}
      {activeSection === 'queries' && (
        <Card className="bg-gray-900/60 border-gray-800">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-violet-400" />
                  {country.flagEmoji} {country.name} Search Queries Configuration
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  Configure custom and default search queries for {country.name}. Select multiple queries to perform bulk enable/disable/delete operations.
                </CardDescription>
              </div>

              {/* Add custom query form */}
              <form onSubmit={handleAddCustomQuery} className="flex flex-wrap items-center gap-2">
                <Input
                  value={newQueryText}
                  onChange={(e) => setNewQueryText(e.target.value)}
                  placeholder="e.g. ugandan full movie"
                  className="h-8 w-52 bg-gray-950 border-gray-800 text-xs text-white rounded-lg"
                />
                <Select value={newQueryType} onValueChange={(val: 'movie' | 'series') => setNewQueryType(val)}>
                  <SelectTrigger className="h-8 w-28 bg-gray-950 border-gray-800 text-xs text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800 text-white">
                    <SelectItem value="movie" className="text-xs">Movie</SelectItem>
                    <SelectItem value="series" className="text-xs">Series</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" type="submit" className="h-8 bg-violet-600 hover:bg-violet-700 text-white text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Query
                </Button>
                <Button size="sm" type="button" variant="outline" onClick={handleResetQueries} className="h-8 bg-gray-950 border-gray-800 text-gray-400 hover:text-white text-xs">
                  Reset
                </Button>
              </form>
            </div>

            {/* MULTI-SELECT BULK ACTIONS BAR FOR QUERIES */}
            {selectedQueryIds.size > 0 && (
              <div className="mt-3 p-2.5 bg-violet-950/40 border border-violet-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-violet-500 text-white font-mono text-xs px-2.5 py-0.5">
                    {selectedQueryIds.size} Queries Selected
                  </Badge>
                  <span className="text-xs text-gray-300">Choose a bulk action:</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => handleBulkToggleQueries(true)}
                    disabled={isProcessingBulk}
                    className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Check className="w-3 h-3 mr-1" /> Enable Selected
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleBulkToggleQueries(false)}
                    disabled={isProcessingBulk}
                    className="h-7 px-2.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300"
                  >
                    <X className="w-3 h-3 mr-1" /> Disable Selected
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBulkDeleteQueries}
                    disabled={isProcessingBulk}
                    className="h-7 px-2.5 text-xs bg-rose-600/80 hover:bg-rose-600 text-white"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Delete Custom
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedQueryIds(new Set())}
                    className="h-7 px-2 text-xs text-gray-400 hover:text-white"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-950/60">
                  <TableRow className="border-gray-800">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={countryQueries.length > 0 && selectedQueryIds.size === countryQueries.length}
                        onCheckedChange={toggleSelectAllQueries}
                        aria-label="Select all queries"
                      />
                    </TableHead>
                    <TableHead className="text-xs text-gray-400">Query Text</TableHead>
                    <TableHead className="text-xs text-gray-400">Category Type</TableHead>
                    <TableHead className="text-xs text-gray-400">Origin</TableHead>
                    <TableHead className="text-xs text-gray-400">Status</TableHead>
                    <TableHead className="text-xs text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {countryQueries.map((q) => {
                    const isSelected = selectedQueryIds.has(q.id);
                    return (
                      <TableRow key={q.id} className={`border-gray-800/60 hover:bg-gray-900/40 ${isSelected ? 'bg-violet-950/20' : ''}`}>
                        <TableCell className="w-10">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectQuery(q.id)}
                            aria-label={`Select query ${q.query}`}
                          />
                        </TableCell>

                        <TableCell className="text-xs font-medium text-white">
                          <span className="font-mono">"{q.query}"</span>
                        </TableCell>

                        <TableCell className="text-xs">
                          <Badge variant="outline" className={`text-[10px] uppercase font-semibold ${q.type === 'movie' ? 'text-orange-400 border-orange-500/30' : 'text-violet-400 border-violet-500/30'}`}>
                            {q.type}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs text-gray-400">
                          {q.isDefault ? (
                            <span className="text-gray-500 text-[11px]">System Default</span>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] bg-violet-500/10 text-violet-300 border-violet-500/20">Custom</Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-xs">
                          <button
                            onClick={() => handleToggleQuery(q.id, !q.enabled)}
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                              q.enabled
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-gray-800 text-gray-400 border-gray-700'
                            }`}
                          >
                            {q.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!q.isDefault && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteQuery(q.id)}
                                className="h-7 px-2 text-[11px] text-rose-400 hover:bg-rose-500/10"
                                title="Delete Query"
                              >
                                <Trash2 className="w-3 h-3 mr-1" /> Delete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION 2: TRUSTED CHANNELS TABLE */}
      {activeSection === 'channels' && (
        <Card className="bg-gray-900/60 border-gray-800">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-orange-400" />
                  Trusted Production Channels ({trustedChannels.length})
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  Approved channels receive a +20 classification boost. Select multiple channels to run bulk scans, approvals, or auto-publish configurations.
                </CardDescription>
              </div>

              {/* Add channel form & batch scan */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleScanAllChannels}
                  disabled={isBatchScanning}
                  className="h-8 bg-gray-950 border border-gray-700 text-orange-400 hover:text-white text-xs"
                >
                  <Radio className={`w-3.5 h-3.5 mr-1.5 ${isBatchScanning ? 'animate-pulse' : ''}`} />
                  {isBatchScanning ? 'Scanning All Channels...' : 'Scan All Channels'}
                </Button>

                <form onSubmit={handleAddChannel} className="flex items-center gap-2">
                  <Input
                    value={newChannelId}
                    onChange={(e) => setNewChannelId(e.target.value)}
                    placeholder="YouTube Channel ID (e.g. UC...)"
                    className="h-8 w-52 bg-gray-950 border-gray-800 text-xs text-white rounded-lg"
                  />
                  <Button size="sm" type="submit" className="h-8 bg-orange-500 hover:bg-orange-600 text-white text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Channel
                  </Button>
                </form>
              </div>
            </div>

            {/* MULTI-SELECT BULK ACTIONS BAR FOR CHANNELS */}
            {selectedChannelIds.size > 0 && (
              <div className="mt-3 p-2.5 bg-blue-950/40 border border-blue-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500 text-white font-mono text-xs px-2.5 py-0.5">
                    {selectedChannelIds.size} Channels Selected
                  </Badge>
                  <span className="text-xs text-gray-300">Bulk operations:</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    size="sm"
                    onClick={handleBulkScanSelectedChannels}
                    disabled={isProcessingBulk}
                    className="h-7 px-2.5 text-xs bg-orange-600 hover:bg-orange-500 text-white font-semibold"
                  >
                    <Radio className="w-3 h-3 mr-1" /> Scan Selected ({selectedChannelIds.size})
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBulkApproveChannels}
                    disabled={isProcessingBulk}
                    className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Check className="w-3 h-3 mr-1" /> Approve & Scan
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBulkPauseChannels}
                    disabled={isProcessingBulk}
                    className="h-7 px-2.5 text-xs bg-amber-600/80 hover:bg-amber-600 text-white"
                  >
                    <Pause className="w-3 h-3 mr-1" /> Mark Pending
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBulkRejectChannels}
                    disabled={isProcessingBulk}
                    className="h-7 px-2.5 text-xs bg-rose-600/80 hover:bg-rose-600 text-white"
                  >
                    <X className="w-3 h-3 mr-1" /> Reject Selected
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleBulkToggleAutoPublish(true)}
                    disabled={isProcessingBulk}
                    className="h-7 px-2.5 text-xs bg-gray-800 hover:bg-gray-700 text-emerald-400"
                  >
                    Enable Auto-Publish
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleBulkToggleAutoPublish(false)}
                    disabled={isProcessingBulk}
                    className="h-7 px-2.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400"
                  >
                    Disable Auto-Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedChannelIds(new Set())}
                    className="h-7 px-2 text-xs text-gray-400 hover:text-white"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-950/60">
                  <TableRow className="border-gray-800">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={trustedChannels.length > 0 && selectedChannelIds.size === trustedChannels.length}
                        onCheckedChange={toggleSelectAllChannels}
                        aria-label="Select all channels"
                      />
                    </TableHead>
                    <TableHead className="text-xs text-gray-400">Channel</TableHead>
                    <TableHead className="text-xs text-gray-400">Country</TableHead>
                    <TableHead className="text-xs text-gray-400">Trust Status</TableHead>
                    <TableHead className="text-xs text-gray-400">Auto Publish</TableHead>
                    <TableHead className="text-xs text-gray-400">Indexed Videos</TableHead>
                    <TableHead className="text-xs text-gray-400">Last Scan</TableHead>
                    <TableHead className="text-xs text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {trustedChannels.map((ch) => {
                    const isSelected = selectedChannelIds.has(ch.channelId);
                    return (
                      <TableRow key={ch.channelId} className={`border-gray-800/60 hover:bg-gray-900/40 ${isSelected ? 'bg-blue-950/20' : ''}`}>
                        <TableCell className="w-10">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectChannel(ch.channelId)}
                            aria-label={`Select channel ${ch.channelTitle}`}
                          />
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="text-xs font-bold text-white">{ch.channelTitle}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{ch.channelId}</p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="text-xs border-white/10 text-gray-300">
                            {ch.country === 'RW' ? '🇷🇼 Rwanda' : ch.country}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={`text-[10px] capitalize ${
                              ch.trust === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : ch.trust === 'rejected'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {ch.trust}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <button
                            onClick={() => GeoContentService.toggleChannelAutoPublish(ch.channelId, !ch.autoPublishMovies).then(loadData)}
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                              ch.autoPublishMovies
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-gray-800 text-gray-400 border-gray-700'
                            }`}
                          >
                            {ch.autoPublishMovies ? 'Enabled' : 'Disabled'}
                          </button>
                        </TableCell>

                        <TableCell className="text-xs">
                          {ch.indexedVideosCount && ch.indexedVideosCount > 0 ? (
                            <span className="font-mono font-bold text-emerald-400">{ch.indexedVideosCount}</span>
                          ) : (
                            <span className="text-[11px] text-gray-500 italic">Not scanned yet</span>
                          )}
                        </TableCell>

                        <TableCell className="text-xs">
                          {isScanningChannel === ch.channelId || ch.lastScanStatus === 'scanning' ? (
                            <Badge className="bg-blue-500/20 text-blue-400 animate-pulse border-blue-500/30 text-[10px]">
                              Scanning...
                            </Badge>
                          ) : ch.lastScanStatus === 'failed' ? (
                            <button
                              onClick={() => setSelectedScanChannel(ch)}
                              className="text-[11px] text-rose-400 hover:underline flex items-center gap-1 font-medium"
                              title="View Failure Details"
                            >
                              <AlertTriangle className="w-3 h-3" /> Failed — View Details
                            </button>
                          ) : ch.lastScanAt ? (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-300">
                                {new Date(ch.lastScanAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                                {new Date(ch.lastScanAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {ch.lastScanStats && (
                                <button
                                  onClick={() => setSelectedScanChannel(ch)}
                                  className="text-[10px] text-orange-400 hover:underline ml-1 font-medium"
                                >
                                  (Details)
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-500 italic">Never</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {ch.trust !== 'approved' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleApproveChannel(ch.channelId)}
                                disabled={isScanningChannel === ch.channelId}
                                className="h-7 px-2 text-[11px] text-emerald-400 hover:bg-emerald-500/10"
                                title="Approve & Scan"
                              >
                                <Check className="w-3 h-3 mr-1" /> Approve
                              </Button>
                            )}

                            {ch.trust !== 'rejected' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRejectChannel(ch.channelId)}
                                disabled={isScanningChannel === ch.channelId}
                                className="h-7 px-2 text-[11px] text-rose-400 hover:bg-rose-500/10"
                                title="Reject"
                              >
                                <X className="w-3 h-3 mr-1" /> Reject
                              </Button>
                            )}

                            {ch.trust !== 'pending' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlePauseChannel(ch.channelId)}
                                disabled={isScanningChannel === ch.channelId}
                                className="h-7 px-2 text-[11px] text-amber-400 hover:bg-amber-500/10"
                                title="Pause"
                              >
                                <Pause className="w-3 h-3 mr-1" /> Pause
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleScanChannel(ch.channelId)}
                              disabled={isScanningChannel === ch.channelId}
                              className="h-7 px-2 text-[11px] bg-gray-950 border-gray-700 text-orange-400 hover:text-white"
                            >
                              <Radio className={`w-3 h-3 mr-1 ${isScanningChannel === ch.channelId ? 'animate-pulse' : ''}`} />
                              {isScanningChannel === ch.channelId ? 'Scanning...' : 'Scan Now'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      </>}

      {/* V2 DISCOVERY RESULTS SECTION */}
      {activeEngine === 'v2' && showV2Comparison && v2DiscoveryResult && (
        <Card className="relative overflow-hidden bg-gradient-to-r from-violet-950/40 via-gray-900/90 to-blue-950/30 border-violet-500/30 shadow-xl mb-6">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  Discovery V2 Run Results — {country.name}
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  Persistent cache-first discovery with explainable 0–100 scoring
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowV2Comparison(false)}
                className="h-7 px-2 text-xs text-gray-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* V2 Results Tabs */}
            <div className="flex gap-2 border-b border-gray-800 pb-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setActiveV2Section('discovery')}
                className={`text-xs ${activeV2Section === 'discovery' ? 'border-b-2 border-violet-500 text-violet-400' : 'text-gray-400'}`}
              >
                <PlayCircle className="w-3 h-3 mr-1" />
                Discovery Stats
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setActiveV2Section('comparison')}
                className={`text-xs ${activeV2Section === 'comparison' ? 'border-b-2 border-violet-500 text-violet-400' : 'text-gray-400'}`}
              >
                <Layers className="w-3 h-3 mr-1" />
                V1 vs V2 Comparison
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setActiveV2Section('series')}
                className={`text-xs ${activeV2Section === 'series' ? 'border-b-2 border-violet-500 text-violet-400' : 'text-gray-400'}`}
              >
                <Radio className="w-3 h-3 mr-1" />
                Series Management
              </Button>
            </div>

            {/* Discovery Stats Tab */}
            {activeV2Section === 'discovery' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-gray-950/80 border border-gray-800">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Published</p>
                  <p className="text-lg font-bold text-emerald-400 mt-1">{v2DiscoveryResult.published || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-950/80 border border-gray-800">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Pending Review</p>
                  <p className="text-lg font-bold text-amber-400 mt-1">{v2DiscoveryResult.pendingReview || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-950/80 border border-gray-800">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Rejected</p>
                  <p className="text-lg font-bold text-rose-400 mt-1">{v2DiscoveryResult.rejected || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-950/80 border border-gray-800">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Cache Hit Rate</p>
                  <p className="text-lg font-bold text-cyan-400 mt-1">{v2DiscoveryResult.cacheHitRate || '—'}%</p>
                </div>
              </div>
            )}

            {/* V1 vs V2 Comparison Tab */}
            {activeV2Section === 'comparison' && (
              <div className="p-4 rounded-lg bg-gray-950/80 border border-gray-800">
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="text-gray-400 mb-2">Metric</p>
                  </div>
                  <div className="border-l border-gray-800 pl-4">
                    <p className="text-orange-400 font-semibold mb-2">V1 (Current)</p>
                  </div>
                  <div className="border-l border-gray-800 pl-4">
                    <p className="text-violet-400 font-semibold mb-2">V2 (New)</p>
                  </div>

                  <div className="col-span-3 border-t border-gray-800/50"></div>

                  <div>
                    <p className="text-gray-300">Scoring Method</p>
                  </div>
                  <div className="border-l border-gray-800 pl-4">
                    <p className="text-gray-500">Single 0-60 score</p>
                  </div>
                  <div className="border-l border-gray-800 pl-4">
                    <p className="text-gray-300">11-dimensional 0-100</p>
                  </div>

                  <div className="col-span-3 border-t border-gray-800/50"></div>

                  <div>
                    <p className="text-gray-300">Publication</p>
                  </div>
                  <div className="border-l border-gray-800 pl-4">
                    <p className="text-gray-500">Manual review</p>
                  </div>
                  <div className="border-l border-gray-800 pl-4">
                    <p className="text-gray-300">Auto (35/76 gates)</p>
                  </div>

                  <div className="col-span-3 border-t border-gray-800/50"></div>

                  <div>
                    <p className="text-gray-300">Series Linking</p>
                  </div>
                  <div className="border-l border-gray-800 pl-4">
                    <p className="text-gray-500">Manual grouping</p>
                  </div>
                  <div className="border-l border-gray-800 pl-4">
                    <p className="text-gray-300">Automatic (patterns)</p>
                  </div>

                  <div className="col-span-3 border-t border-gray-800/50"></div>

                  <div>
                    <p className="text-gray-300">Caching</p>
                  </div>
                  <div className="border-l border-gray-800 pl-4">
                    <p className="text-gray-500">Per-run browser worker</p>
                  </div>
                  <div className="border-l border-gray-800 pl-4">
                    <p className="text-gray-300">Firestore query and metadata reuse</p>
                  </div>
                </div>
              </div>
            )}

            {/* Series Management Tab */}
            {activeV2Section === 'series' && (
              <div className="p-4 rounded-lg bg-gray-950/80 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-300">Discovered Series</p>
                  <Badge variant="secondary" className="text-[11px]">{v2DiscoveryResult.seriesCount || 0} series</Badge>
                </div>
                {v2DiscoveryResult.seriesCount > 0 ? (
                  <div className="text-xs text-gray-400 space-y-2">
                    <p>✓ Series/Season/Episode hierarchy created</p>
                    <p>✓ Episode deduplication applied</p>
                    <p>✓ Series fingerprinting enabled</p>
                    <p className="text-violet-400 font-semibold">→ Ready for episode linking review</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 py-4 text-center">No series detected in this scan</p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleRunV2Discovery}
                disabled={isRunningV2Discovery}
                className="text-xs bg-violet-600 hover:bg-violet-500 text-white"
              >
                <RefreshCw className={`w-3 h-3 mr-1.5 ${isRunningV2Discovery ? 'animate-spin' : ''}`} />
                {isRunningV2Discovery ? 'Re-running...' : 'Run V2 Again'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowV2Comparison(false)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Close Results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION 3: CONTENT MODERATION TABLE (Section 19) */}
      {activeSection === 'content' && (
        <Card className="bg-gray-900/60 border-gray-800">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-orange-400" />
                  Discovered Content Moderation ({contentItems.length})
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  Review YouTube video duration, classification score, channel trust, and publication status. Select multiple items to bulk publish, reject, reclassify, or remove.
                </CardDescription>
              </div>

              {/* Filter controls */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by title/channel..."
                    className="pl-8 h-8 w-44 bg-gray-950 border-gray-800 text-xs text-white rounded-lg"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-32 bg-gray-950 border-gray-800 text-xs text-white rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800 text-white">
                    <SelectItem value="all" className="text-xs">All Status</SelectItem>
                    <SelectItem value="published" className="text-xs">Published</SelectItem>
                    <SelectItem value="pending_review" className="text-xs">Pending Review</SelectItem>
                    <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                    <SelectItem value="unavailable" className="text-xs">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* MULTI-SELECT BULK ACTIONS BAR FOR CONTENT */}
            {selectedContentIds.size > 0 && (
              <div className="mt-3 p-2.5 bg-orange-950/40 border border-orange-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-500 text-white font-mono text-xs px-2.5 py-0.5">
                    {selectedContentIds.size} Videos Selected
                  </Badge>
                  <span className="text-xs text-gray-300">Execute bulk action:</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    size="sm"
                    onClick={handleBulkPublishContent}
                    disabled={isProcessingBulk}
                    className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
                  >
                    <Check className="w-3 h-3 mr-1" /> Publish Selected ({selectedContentIds.size})
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleBulkReclassifyContent('movie')}
                    disabled={isProcessingBulk}
                    className="h-7 px-2.5 text-xs bg-gray-800 hover:bg-gray-700 text-orange-400"
                  >
                    Set as Movie
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleBulkReclassifyContent('series')}
                    disabled={isProcessingBulk}
                    className="h-7 px-2.5 text-xs bg-gray-800 hover:bg-gray-700 text-violet-400"
                  >
                    Set as Series
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBulkRejectContent}
                    disabled={isProcessingBulk}
                    className="h-7 px-2.5 text-xs bg-rose-600/80 hover:bg-rose-600 text-white"
                  >
                    <X className="w-3 h-3 mr-1" /> Reject Selected
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBulkDeleteContent}
                    disabled={isProcessingBulk}
                    className="h-7 px-2.5 text-xs bg-gray-900 border border-gray-700 text-gray-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Remove from Catalog
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedContentIds(new Set())}
                    className="h-7 px-2 text-xs text-gray-400 hover:text-white"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-950/60">
                  <TableRow className="border-gray-800">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={contentItems.length > 0 && selectedContentIds.size === contentItems.length}
                        onCheckedChange={toggleSelectAllContent}
                        aria-label="Select all videos"
                      />
                    </TableHead>
                    <TableHead className="text-xs text-gray-400">Thumbnail & Title</TableHead>
                    <TableHead className="text-xs text-gray-400">Channel</TableHead>
                    <TableHead className="text-xs text-gray-400">Duration</TableHead>
                    <TableHead className="text-xs text-gray-400">Views</TableHead>
                    <TableHead className="text-xs text-gray-400">Type / Score</TableHead>
                    <TableHead className="text-xs text-gray-400">Trust</TableHead>
                    <TableHead className="text-xs text-gray-400">Status</TableHead>
                    <TableHead className="text-xs text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-xs text-gray-400">
                        <RefreshCw className="w-5 h-5 text-orange-500 animate-spin mx-auto mb-2" />
                        Loading discovered videos...
                      </TableCell>
                    </TableRow>
                  ) : contentItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-xs text-gray-400">
                        No discovered YouTube videos stored for {country.name}. Click "Discover {country.name} Movies" above to run discovery.
                      </TableCell>
                    </TableRow>
                  ) : (
                    contentItems.map((item) => {
                      const isSelected = selectedContentIds.has(item.id);
                      return (
                        <TableRow key={item.id} className={`border-gray-800/60 hover:bg-gray-900/40 ${isSelected ? 'bg-orange-950/20' : ''}`}>
                          <TableCell className="w-10">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectContent(item.id)}
                              aria-label={`Select ${item.title}`}
                            />
                          </TableCell>

                          <TableCell className="max-w-xs">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={item.thumbnail || item.thumbnailUrl}
                                alt={item.title}
                                className="w-16 h-10 object-cover rounded shrink-0 bg-gray-950"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate" title={item.title}>
                                  {item.title}
                                </p>
                                <p className="text-[10px] text-gray-400 font-mono">{item.id}</p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-gray-300">
                            {item.channelTitle}
                          </TableCell>

                          <TableCell className="text-xs font-mono text-gray-300">
                            {item.durationFormatted}
                          </TableCell>

                          <TableCell className="text-xs text-gray-400 font-mono">
                            {(item.views || item.viewCount || 0).toLocaleString()}
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className={`text-[10px] uppercase font-semibold ${
                                  item.classification === 'movie'
                                    ? 'border-orange-500/30 text-orange-400'
                                    : item.classification === 'series' || item.classification === 'episode'
                                    ? 'border-violet-500/30 text-violet-400'
                                    : 'border-gray-700 text-gray-400'
                                }`}
                              >
                                {item.classification}
                              </Badge>
                              <span className="font-mono text-[11px] text-gray-400 font-bold">{((item as Record<string, unknown>).overallScore as number) ?? item.score ?? 0}/100</span>
                              </div>
                              {activeEngine === 'v2' && (item as Record<string, unknown>).scoringDimensions && (
                                <p className="text-[9px] text-gray-500" title={((item as Record<string, unknown>).scoreReasons as Array<{ explanation: string }> | undefined)?.map((reason) => reason.explanation).join('\n') || 'No stored evidence'}>
                                  Geo {((item as Record<string, unknown>).geoScore as number) ?? ((item as Record<string, unknown>).scoringDimensions as Record<string, number>).countryScore} · Content {((item as Record<string, unknown>).contentScore as number) ?? ((item as Record<string, unknown>).scoringDimensions as Record<string, number>).contentTypeScore} · Series {((item as Record<string, unknown>).seriesScore as number) ?? ((item as Record<string, unknown>).scoringDimensions as Record<string, number>).seriesScore}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              className={`text-[10px] capitalize ${
                                item.channelTrust === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : item.channelTrust === 'rejected'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {item.channelTrust}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Badge
                              className={`text-[10px] capitalize ${
                                item.status === 'published'
                                  ? 'bg-emerald-500 text-white'
                                  : item.status === 'pending_review'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-gray-800 text-gray-400'
                              }`}
                            >
                              {item.status}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {item.status !== 'published' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUpdateStatus(item.id, 'published', true, 'movie')}
                                  className="h-7 px-2 text-[11px] text-emerald-400 hover:bg-emerald-500/10"
                                  title="Publish to Catalog"
                                >
                                  Publish
                                </Button>
                              )}

                              {item.status !== 'rejected' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUpdateStatus(item.id, 'rejected', false)}
                                  className="h-7 px-2 text-[11px] text-rose-400 hover:bg-rose-500/10"
                                  title="Reject"
                                >
                                  Reject
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const nextType: GeoContentType = item.classification === 'movie' ? 'series' : 'movie';
                                  void handleUpdateStatus(item.id, item.status, nextType === 'movie', nextType);
                                }}
                                className="h-7 px-2 text-[11px] text-gray-400 hover:text-white"
                                title="Toggle Type"
                              >
                                Reclassify
                              </Button>

                              {item.channelTrust !== 'approved' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleApproveChannel(item.youtubeChannelId || item.channelId || '')}
                                  className="h-7 px-2 text-[11px] text-blue-400 hover:bg-blue-500/10"
                                  title="Approve Channel"
                                >
                                  +Trust
                                </Button>
                              )}

                              <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-white" title="Watch on Site">
                                <Link to={`/${item.country.toLowerCase()}/movies/${item.slug || item.youtubeVideoId}`}>
                                  <Play className="w-3.5 h-3.5" />
                                </Link>
                              </Button>

                              <a
                                href={item.youtubeUrl || `https://www.youtube.com/watch?v=${item.youtubeVideoId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                                title="View on YouTube"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SCAN DETAILS DIALOG */}
      <Dialog open={Boolean(selectedScanChannel)} onOpenChange={(open) => !open && setSelectedScanChannel(null)}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-orange-400" />
              Channel Scan Details
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Audit metrics for YouTube channel uploads scanning and automatic catalog publishing.
            </DialogDescription>
          </DialogHeader>

          {selectedScanChannel && (
            <div className="space-y-4 pt-2">
              <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                <p className="text-xs text-gray-400">Channel Name</p>
                <p className="text-sm font-semibold text-white mt-0.5">{selectedScanChannel.channelTitle}</p>
                <p className="text-[11px] font-mono text-gray-500 mt-0.5">{selectedScanChannel.channelId}</p>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-900 text-xs">
                  <span className="text-gray-400">Country:</span>
                  <Badge variant="outline" className="text-[10px] border-white/10 text-gray-300">
                    {selectedScanChannel.country}
                  </Badge>
                  <span className="text-gray-400 ml-2">Status:</span>
                  <Badge
                    className={`text-[10px] capitalize ${
                      selectedScanChannel.trust === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : selectedScanChannel.trust === 'rejected'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {selectedScanChannel.trust}
                  </Badge>
                </div>
              </div>

              {selectedScanChannel.lastScanStats ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-950/80 p-2.5 rounded-lg border border-gray-800/80">
                      <p className="text-gray-400 text-[11px]">Fetched Videos</p>
                      <p className="text-base font-bold text-white mt-0.5">{selectedScanChannel.lastScanStats.fetched}</p>
                    </div>
                    <div className="bg-gray-950/80 p-2.5 rounded-lg border border-gray-800/80">
                      <p className="text-gray-400 text-[11px]">Qualifying</p>
                      <p className="text-base font-bold text-orange-400 mt-0.5">{selectedScanChannel.lastScanStats.qualifying}</p>
                    </div>
                    <div className="bg-gray-950/80 p-2.5 rounded-lg border border-gray-800/80">
                      <p className="text-gray-400 text-[11px]">Indexed in Catalog</p>
                      <p className="text-base font-bold text-sky-400 mt-0.5">{selectedScanChannel.lastScanStats.indexed}</p>
                    </div>
                    <div className="bg-gray-950/80 p-2.5 rounded-lg border border-gray-800/80">
                      <p className="text-gray-400 text-[11px]">Published to Website</p>
                      <p className="text-base font-bold text-emerald-400 mt-0.5">{selectedScanChannel.lastScanStats.published}</p>
                    </div>
                  </div>

                  <div className="bg-gray-950/80 p-2.5 rounded-lg border border-gray-800/80 text-xs flex justify-between">
                    <span className="text-gray-400">Skipped / Non-Qualifying:</span>
                    <span className="text-gray-300 font-medium">{selectedScanChannel.lastScanStats.skipped}</span>
                  </div>

                  {selectedScanChannel.lastScanStats.errorMessage && (
                    <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-lg text-xs text-rose-300">
                      <p className="font-semibold mb-0.5">Error Message:</p>
                      <p className="font-mono text-[11px]">{selectedScanChannel.lastScanStats.errorMessage}</p>
                    </div>
                  )}

                  <p className="text-[11px] text-gray-500 text-right">
                    Scanned at:{' '}
                    {new Date(
                      selectedScanChannel.lastScanStats.scannedAt || selectedScanChannel.lastScanAt || ''
                    ).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-4 text-center">No detailed scan metrics recorded yet.</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const id = selectedScanChannel.channelId;
                    setSelectedScanChannel(null);
                    void handleScanChannel(id);
                  }}
                  className="bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white text-xs"
                >
                  <Radio className="w-3.5 h-3.5 mr-1" /> Scan Again Now
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
