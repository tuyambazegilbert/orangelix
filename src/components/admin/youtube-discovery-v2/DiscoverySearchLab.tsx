/**
 * OrangeFlix YouTube Discovery V2 — Search Test Lab Component
 * Live interactive sandbox to test custom queries and preview V2 0–100 scoring in real-time.
 */

import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Play,
  Film,
  Tv,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { YouTubeClient } from '@/features/youtube/client';
import {
  classifyYouTubeVideoV2,
  DISCOVERY_V2_SCORING_CONFIG,
  detectEpisodePattern,
  analyzeCountryEvidence,
  ClassificationResult,
} from '@/features/youtube/discoveryV2';
import { SUPPORTED_COUNTRIES } from '@/features/geo/countryConfig';

interface TestCandidateResult {
  videoId: string;
  title: string;
  channelTitle: string;
  durationFormatted: string;
  thumbnailUrl: string;
  scoring: ClassificationResult;
}

interface DiscoverySearchLabProps {
  selectedCountry?: string;
  onSelectCountry?: (code: string) => void;
}

export const DiscoverySearchLab: React.FC<DiscoverySearchLabProps> = ({
  selectedCountry: initialCountry = 'RW',
  onSelectCountry,
}) => {
  const [testQuery, setTestQuery] = useState('filime nyarwanda agasobanuye full movie');
  const [localCountry, setLocalCountry] = useState(initialCountry === 'ALL' ? 'RW' : initialCountry);
  const selectedCountry = initialCountry !== 'ALL' && onSelectCountry ? initialCountry : localCountry;
  const setSelectedCountry = (code: string) => {
    setLocalCountry(code);
    onSelectCountry?.(code);
  };
  const [maxResults, setMaxResults] = useState(6);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestCandidateResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExecuteTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim() || isRunning) return;

    setIsRunning(true);
    setErrorMessage(null);
    setResults([]);

    try {
      const countryConfig = SUPPORTED_COUNTRIES[selectedCountry];
      const searchRes = await YouTubeClient.searchVideos({
        query: testQuery.trim(),
        maxResults,
        regionCode: selectedCountry,
        relevanceLanguage: countryConfig?.defaultLanguage || 'en',
      });

      if (searchRes.error) {
        throw new Error(searchRes.error);
      }

      if (searchRes.videoIds.length === 0) {
        setResults([]);
        return;
      }

      const details = await YouTubeClient.getVideoDetails(searchRes.videoIds);
      const tested: TestCandidateResult[] = [];

      for (const v of details) {
        const pattern = detectEpisodePattern(`${v.title}\n${v.description || ''}`);
        const geo = analyzeCountryEvidence(
          selectedCountry,
          v.title,
          v.description || '',
          undefined,
          undefined,
          countryConfig?.defaultLanguage || 'en',
          v.tags || []
        );

        const scoring = await classifyYouTubeVideoV2(
          {
            title: v.title,
            description: v.description,
            durationSeconds: v.durationSeconds,
            category: v.categoryId,
            tags: v.tags,
            channelId: v.channelId,
            channelTitle: v.channelTitle,
            channelCountry: selectedCountry,
            channelTrust: 'pending',
            countryCode: selectedCountry,
            language: countryConfig?.defaultLanguage || 'en',
            isEmbeddable: v.isEmbeddable,
            publishedAt: v.publishedAt ? new Date(v.publishedAt) : undefined,
            views: v.viewCount,
            likes: v.likeCount,
            minMovieDurationMinutes: countryConfig?.minMovieDurationMinutes || 45,
          },
          DISCOVERY_V2_SCORING_CONFIG,
          geo.evidence.map((keyword) => ({ keyword, weight: 8 })),
          pattern || undefined
        );

        tested.push({
          videoId: v.videoId,
          title: v.title,
          channelTitle: v.channelTitle,
          durationFormatted: v.durationFormatted,
          thumbnailUrl: v.thumbnailUrl,
          scoring,
        });
      }

      setResults(tested);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsRunning(false);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 76) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {score}/100 • Auto Publish
        </span>
      );
    }
    if (score >= 35) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {score}/100 • Pending Review
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        {score}/100 • Gated / Reject
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-card/60 border border-border rounded-xl p-5">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-400" />
          Discovery V2 Sandbox & Search Lab
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Execute live test queries against YouTube and preview 0–100 scoring and publication decisions without saving to Firestore.
        </p>
      </div>

      {/* Query Form */}
      <form onSubmit={handleExecuteTest} className="bg-card/60 border border-border rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1.5">
              Test Query String
            </label>
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="e.g. katogo ugandan movies full hd"
              required
              className="w-full bg-card border border-border rounded-lg px-3.5 py-2 text-xs text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1.5">
              Territory Profile
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-card border border-border text-xs rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              {Object.entries(SUPPORTED_COUNTRIES).map(([code, config]) => (
                <option key={code} value={code}>
                  {config.flagEmoji} {config.name} ({code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1.5">
              Max Results
            </label>
            <select
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="w-full bg-card border border-border text-xs rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value={3}>3 videos</option>
              <option value={6}>6 videos</option>
              <option value={12}>12 videos</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isRunning}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium text-xs rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Zap className="w-3.5 h-3.5 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                Simulate Search & Score
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error display */}
      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground">
            Scored Candidates Preview ({results.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((res) => (
              <div
                key={res.videoId}
                className="bg-card/60 border border-border rounded-xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-secondary-foreground uppercase">
                      {res.scoring.contentType}
                    </span>
                    <span className="text-xs text-muted-foreground">{res.durationFormatted}</span>
                  </div>

                  {getScoreBadge(res.scoring.overallScore)}
                </div>

                <div className="flex gap-3">
                  <div className="w-24 h-16 rounded overflow-hidden bg-black/40 shrink-0">
                    <img src={res.thumbnailUrl} alt={res.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-foreground line-clamp-2">{res.title}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{res.channelTitle}</p>
                  </div>
                </div>

                {/* Score Reasons */}
                <div className="space-y-1 text-xs">
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Evidence Reasons:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {res.scoring.scoreReasons.map((r, i) => (
                      <span
                        key={i}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          r.impact > 0
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : 'bg-rose-500/10 text-rose-300'
                        }`}
                      >
                        {r.explanation} ({r.impact > 0 ? `+${r.impact}` : r.impact})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
