/**
 * OrangeFlix Discovery V2 — Channel Analyzer
 * Channel trust scoring and historical accuracy tracking
 */

import { TrustedChannelV2, ChannelTrust } from './types';
import {
  CHANNEL_SCORE_IMPACTS,
  AUTO_TRUST_REQUIREMENTS,
  DISCOVERY_V2_SCORING_CONFIG,
} from './constants';
import { clamp } from './utils';

/**
 * Calculate channel trust score (0–100)
 */
export function calculateChannelTrustScore(
  totalAnalyzed: number,
  acceptedCount: number,
  rejectedCount: number,
  isAdminApproved: boolean,
  countryConsistency: number = 0 // 0–100
): number {
  if (totalAnalyzed === 0) return 50; // Neutral for unknown channels

  let score = 50; // Baseline

  // Accept/reject ratio
  const acceptanceRate = (acceptedCount / totalAnalyzed) * 100;
  if (acceptanceRate > 80) {
    score += 30;
  } else if (acceptanceRate > 60) {
    score += 15;
  } else if (acceptanceRate > 40) {
    score += 5;
  } else {
    score -= 20;
  }

  // Admin approval adds significant boost
  if (isAdminApproved) {
    score += 30;
  }

  // Country consistency bonus
  score += (countryConsistency / 100) * 20;

  // Penalize channels with too many rejections
  const rejectionRate = (rejectedCount / totalAnalyzed) * 100;
  if (rejectionRate > 50) {
    score -= 30;
  } else if (rejectionRate > 30) {
    score -= 15;
  }

  return clamp(Math.round(score), 0, 100);
}

/**
 * Calculate country consistency score for a channel
 */
export function calculateCountryConsistency(
  videosPerCountry: Record<string, number>,
  targetCountry: string
): number {
  const totalVideos = Object.values(videosPerCountry).reduce((a, b) => a + b, 0);
  if (totalVideos === 0) return 0;

  const targetCountryVideos = videosPerCountry[targetCountry] || 0;
  const consistency = (targetCountryVideos / totalVideos) * 100;

  return clamp(Math.round(consistency), 0, 100);
}

/**
 * Calculate channel quality score based on metadata quality
 */
export function calculateChannelQualityScore(metadata?: {
  description?: string;
  thumbnailUrl?: string;
  subscriberCount?: number;
  videoCount?: number;
}): number {
  let score = 50; // Baseline

  if (metadata?.description && metadata.description.length > 100) {
    score += 15;
  }

  if (metadata?.thumbnailUrl) {
    score += 10;
  }

  if (metadata?.subscriberCount && metadata.subscriberCount > 10000) {
    score += 20;
  } else if (metadata?.subscriberCount && metadata.subscriberCount > 1000) {
    score += 10;
  }

  if (metadata?.videoCount && metadata.videoCount > 100) {
    score += 15;
  } else if (metadata?.videoCount && metadata.videoCount > 20) {
    score += 10;
  }

  return clamp(score, 0, 100);
}

/**
 * Check if a channel is eligible for automatic trust
 */
export function isEligibleForAutoTrust(
  channel: TrustedChannelV2,
  discoveryRuns: number,
  config = DISCOVERY_V2_SCORING_CONFIG
): boolean {
  const requirements = AUTO_TRUST_REQUIREMENTS;

  // Check all eligibility criteria
  if (channel.channelTrustScore < requirements.MIN_TRUST_SCORE) {
    return false;
  }

  if (discoveryRuns < requirements.MIN_DISCOVERY_RUNS) {
    return false;
  }

  const totalAnalyzed = channel.totalAnalyzed || 0;
  const acceptedCount = channel.acceptedCount || 0;

  if (acceptedCount < requirements.MIN_QUALIFYING_ITEMS) {
    return false;
  }

  if (channel.countryScore < requirements.MIN_COUNTRY_CONSISTENCY) {
    return false;
  }

  const rejectionRate = totalAnalyzed > 0 ? (channel.rejectedCount || 0) / totalAnalyzed : 0;
  if (rejectionRate > requirements.MAX_REJECTION_RATE) {
    return false;
  }

  return true;
}

/**
 * Calculate channel scan priority
 * Determines how often a channel should be rescanned
 */
export function calculateChannelScanPriority(
  channel: TrustedChannelV2
): 'high' | 'normal' | 'low' | 'paused' {
  if (channel.trust === 'rejected') {
    return 'paused';
  }

  if (channel.trust === 'approved') {
    if (channel.channelTrustScore > 90 && channel.totalAnalyzed > 10) {
      return 'high'; // Trusted source, scan frequently
    }
    return 'normal';
  }

  // Pending channel
  if (channel.channelTrustScore > 75) {
    return 'high'; // Promising, scan frequently
  }

  if (channel.channelTrustScore > 50) {
    return 'normal';
  }

  return 'low';
}

/**
 * Update channel statistics after analyzing new content
 */
export function updateChannelStats(
  channel: TrustedChannelV2,
  newAnalyzedCount: number,
  newAcceptedCount: number,
  newRejectedCount: number
): TrustedChannelV2 {
  const updatedChannel = { ...channel };

  updatedChannel.totalAnalyzed = (channel.totalAnalyzed || 0) + newAnalyzedCount;
  updatedChannel.acceptedCount = (channel.acceptedCount || 0) + newAcceptedCount;
  updatedChannel.rejectedCount = (channel.rejectedCount || 0) + newRejectedCount;

  // Recalculate historical accuracy
  if (updatedChannel.totalAnalyzed > 0) {
    updatedChannel.historicalAccuracy =
      (updatedChannel.acceptedCount / updatedChannel.totalAnalyzed) * 100;
  }

  // Recalculate trust score
  updatedChannel.channelTrustScore = calculateChannelTrustScore(
    updatedChannel.totalAnalyzed,
    updatedChannel.acceptedCount,
    updatedChannel.rejectedCount,
    updatedChannel.trust === 'approved',
    updatedChannel.countryScore
  );

  updatedChannel.lastScannedAt = new Date();
  return updatedChannel;
}

/**
 * Calculate next recommended scan time for a channel
 */
export function calculateNextScanTime(
  channel: TrustedChannelV2,
  trustTTLDays: number = 7
): Date {
  const now = new Date();

  if (!channel.lastScannedAt) {
    return now; // Scan immediately if never scanned
  }

  // Days since last scan
  const daysSinceLastScan = Math.floor(
    (now.getTime() - new Date(channel.lastScannedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const priority = channel.discoveryPriority || 'normal';

  // Calculate scan frequency based on priority
  let scanIntervalDays: number;
  switch (priority) {
    case 'high':
      scanIntervalDays = 1; // Every day
      break;
    case 'normal':
      scanIntervalDays = 3; // Every 3 days
      break;
    case 'low':
      scanIntervalDays = 7; // Weekly
      break;
    case 'paused':
      scanIntervalDays = 30; // Monthly
      break;
  }

  if (daysSinceLastScan >= scanIntervalDays) {
    return now; // Due for scan
  }

  const nextScan = new Date(channel.lastScannedAt);
  nextScan.setDate(nextScan.getDate() + scanIntervalDays);
  return nextScan;
}

/**
 * Create evidence summary for channel
 */
export function createChannelEvidence(channel: TrustedChannelV2): string[] {
  const evidence: string[] = [];

  if (channel.trust === 'approved') {
    evidence.push('Administrator approved');
  }

  if (channel.totalAnalyzed > 0) {
    const acceptanceRate = ((channel.acceptedCount || 0) / channel.totalAnalyzed) * 100;
    evidence.push(`Acceptance rate: ${Math.round(acceptanceRate)}%`);
  }

  if (channel.countryScore > 80) {
    evidence.push('Strong country consistency');
  }

  if (channel.channelTrustScore > 80) {
    evidence.push('High trust score');
  }

  if (channel.moviesFound && channel.moviesFound > 0) {
    evidence.push(`${channel.moviesFound} movies discovered`);
  }

  if (channel.seriesFound && channel.seriesFound > 0) {
    evidence.push(`${channel.seriesFound} series discovered`);
  }

  return evidence;
}

/**
 * Get channel trust status label
 */
export function getChannelTrustLabel(trust: ChannelTrust): string {
  switch (trust) {
    case 'approved':
      return 'Approved';
    case 'pending':
      return 'Pending Review';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Unknown';
  }
}

/**
 * Check if channel meets minimum quality standards
 */
export function meetsChannelQualityStandards(
  channel: TrustedChannelV2,
  minTrustScore: number = 50
): boolean {
  // Basic checks
  if (!channel.channelId || !channel.channelTitle) {
    return false;
  }

  if (channel.channelTrustScore < minTrustScore) {
    return false;
  }

  // Channel should not be rejected
  if (channel.trust === 'rejected') {
    return false;
  }

  return true;
}
