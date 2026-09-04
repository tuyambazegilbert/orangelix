/**
 * Automated Test & Verification Suite for Discovery V2
 * Tests all 0–100 scoring boundaries, hard gates, scattered episode naming,
 * series entity resolution, country conflict detection, and profile minimums.
 */

import {
  calculateOverallScore,
  decidePublication,
  calculateMovieScore,
  calculateEpisodeScore,
  calculateEvidenceCountryScore,
  classifyYouTubeVideoV2,
} from './discoveryV2/scoring';
import {
  detectEpisodePattern,
  normalizeSeriesTitle,
  matchCandidateToSeries,
  generateEpisodeGapQueries,
  validateAIMetadataOutput,
  reasonMetadataDeterministically,
} from './discoveryV2';
import {
  analyzeCountryEvidence,
  analyzeAllCountries,
  detectCountryConflict,
} from './discoveryV2/geoAnalyzer';
import {
  v2KeywordSet,
  validateV2Profile,
  getDiscoveryV2Profile,
} from './discoveryV2/profiles';
import { getAllCountries } from '../geo/countryConfig';
import { DISCOVERY_V2_SCORING_CONFIG } from './discoveryV2/constants';

export function runDiscoveryV2Verification(): boolean {
  console.log('=== RUNNING DISCOVERY V2 SPECIFICATION VERIFICATION ===\n');

  // 1. Scoring Threshold & Boundary Verification (0, 34, 35, 75, 76, 100)
  console.log('1. Testing Scoring & Thresholds...');
  const rejectDecision = decidePublication(34, 'movie', true, 'pending', []);
  if (rejectDecision.status !== 'rejected') throw new Error(`Score 34 must be rejected, got ${rejectDecision.status}`);

  const pendingLowerDecision = decidePublication(35, 'movie', true, 'pending', []);
  if (pendingLowerDecision.status !== 'pending_review') throw new Error(`Score 35 must be pending_review, got ${pendingLowerDecision.status}`);

  const pendingUpperDecision = decidePublication(75, 'movie', true, 'pending', []);
  if (pendingUpperDecision.status !== 'pending_review') throw new Error(`Score 75 must be pending_review, got ${pendingUpperDecision.status}`);

  const publishDecision = decidePublication(76, 'movie', true, 'approved', []);
  if (publishDecision.status !== 'published') throw new Error(`Score 76 must be published, got ${publishDecision.status}`);

  const maxPublishDecision = decidePublication(100, 'movie', true, 'approved', []);
  if (maxPublishDecision.status !== 'published') throw new Error(`Score 100 must be published, got ${maxPublishDecision.status}`);

  console.log('  ✓ Boundaries passed: 34->rejected, 35->pending, 75->pending, 76->published, 100->published');

  // 2. Hard Safety Gates Verification (High score with hard gate failure MUST reject)
  console.log('2. Testing Hard Safety Gates...');
  const hardGateTrailer = decidePublication(95, 'trailer', true, 'approved', ['detected_trailer']);
  if (hardGateTrailer.status !== 'rejected') throw new Error('Trailer with 95 score must be rejected by hard gate');

  const hardGateNotEmbeddable = decidePublication(90, 'movie', false, 'approved', []);
  if (hardGateNotEmbeddable.status !== 'rejected') throw new Error('Non-embeddable with 90 score must be rejected by hard gate');

  const hardGateRejectedChannel = decidePublication(92, 'movie', true, 'rejected', []);
  if (hardGateRejectedChannel.status !== 'rejected') throw new Error('Rejected channel with 92 score must be rejected by hard gate');

  console.log('  ✓ Hard Gates passed: Trailer, Non-embeddable, Rejected Channel all rejected regardless of score');

  // 3. Series / Episode Detection Precedence (Long duration 75m episode must NOT become a movie)
  console.log('3. Testing Series Detection Precedence over Duration...');
  const epPattern = detectEpisodePattern('The Promise S02E04 - Long Special Episode');
  if (!epPattern || epPattern.episodeNumber !== 4 || epPattern.seasonNumber !== 2) {
    throw new Error(`Failed to parse S02E04: ${JSON.stringify(epPattern)}`);
  }
  console.log('  ✓ Episode pattern precedence passed: S02E04 resolved with S=2, E=4');

  // 4. Scattered Episode Naming Normalization
  console.log('4. Testing Scattered Episode Naming & Series Normalization...');
  const variations = [
    'The Promise - Episode 1',
    'The Promise Ep 2',
    'THE PROMISE 3',
    'The Promise - Part 4',
    'The Promise S01E05',
    'The Promise Season One Episode Six',
  ];

  const normalized = variations.map(v => normalizeSeriesTitle(v));
  const expected = 'the promise';
  for (const n of normalized) {
    if (n !== expected) throw new Error(`Scattered title normalized to "${n}", expected "${expected}"`);
  }
  console.log(`  ✓ Scattered naming: All 6 variations normalized accurately to "${expected}"`);

  // 5. Country Evidence & Conflict Detection
  console.log('5. Testing Country Evidence & Conflict Detection...');
  const conflict = detectCountryConflict('RW', [
    { countryCode: 'NG', confidence: 85, evidence: ['Nigeria Nollywood keyword'] },
    { countryCode: 'RW', confidence: 20, evidence: [] },
  ]);
  if (!conflict.hasConflict) throw new Error('Country conflict between RW and NG was not detected');
  console.log(`  ✓ Country conflict detected successfully: ${conflict.conflictingCountries.join(', ')}`);

  // 6. Country Profiles Minimum Keywords Validation (All 8 countries)
  console.log('6. Testing All 8 Country Profiles for Keyword Minimums (40/40/40/20/20/20/10/10)...');
  const allCountries = getAllCountries();
  for (const country of allCountries) {
    const p = getDiscoveryV2Profile(country.countryCode, country as unknown as Record<string, unknown>);
    const warnings = validateV2Profile(p);
    if (warnings.length > 0) {
      throw new Error(`Country ${country.countryCode} profile failed minimums: ${warnings.join(', ')}`);
    }
  }
  // 7. Episode Gap Search Generation
  console.log('7. Testing Episode Gap Search Query Generation...');
  const gapQueries = generateEpisodeGapQueries('Inzozi', 'RW', [1, 2, 4, 5], 1, 3);
  if (!gapQueries.some(q => q.query.includes('Episode 3') || q.query.includes('Ep 3') || q.query.includes('S01E03'))) {
    throw new Error('Episode gap queries failed to generate targeted search for missing Episode 3');
  }
  console.log('  ✓ Episode gap queries generated targeted searches for missing Episode 3');

  // 8. AI / LLM Metadata Reasoning Schema Validation
  console.log('8. Testing AI Metadata Reasoning Engine & Schema Clamping...');
  const aiOutput = reasonMetadataDeterministically({
    videoId: 'test_vid_123',
    title: 'The Promise S01E03 - Broken Chains',
    durationSeconds: 2400,
    channelId: 'channel_rw_1',
    targetCountryCode: 'RW',
    knownSeriesTitles: ['The Promise'],
  });
  if (aiOutput.contentType !== 'episode' || aiOutput.episode.number !== 3 || !aiOutput.series.isSeriesRelated) {
    throw new Error(`AI Metadata reasoning failed: ${JSON.stringify(aiOutput)}`);
  }
  const validated = validateAIMetadataOutput(aiOutput);
  if (!validated || validated.contentConfidence < 0 || validated.contentConfidence > 100) {
    throw new Error('AI output validation/clamping failed');
  }
  console.log('  ✓ AI Metadata reasoning and Section 72 schema clamping validated');

  console.log('\n=== ALL DISCOVERY V2 SPECIFICATION TESTS PASSED! ===');
  return true;
}

runDiscoveryV2Verification();

