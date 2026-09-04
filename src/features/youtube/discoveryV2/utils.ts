/**
 * OrangeFlix Discovery V2 — Utility Functions
 * Common helper functions for normalization, similarity, hashing, etc.
 */

/**
 * Normalize a string for comparison
 * Removes diacritics, converts to lowercase, removes punctuation and extra whitespace
 */
export function normalizeString(text: string): string {
  if (!text) return '';

  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accents
    .replace(/[\u0300-\u036f]/g, '') // Remove combining marks
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
}

/**
 * Normalize a series title by removing episode markers
 */
export function normalizeSeriesTitle(title: string): string {
  if (!title) return '';

  let normalized = title;

  // Remove episode markers
  normalized = normalized.replace(/[Ss](\d{1,2})[Ee](\d{1,2})/g, ''); // S01E01
  normalized = normalized.replace(/[Ee]pisode\s+\d+/gi, ''); // Episode 1
  normalized = normalized.replace(/[Ee]pisode\s+(one|two|three|four|five|six|seven|eight|nine|ten)/gi, '');
  normalized = normalized.replace(/[Ee]p\s*\.?\s*\d+/gi, ''); // Ep 1
  normalized = normalized.replace(/\b[Ee]\s*0?\d{1,3}\b/g, ''); // E01
  normalized = normalized.replace(/[Pp]art\s+\d+/gi, ''); // Part 1
  normalized = normalized.replace(/[Pp]art\s+(one|two|three|four|five|six|seven|eight|nine|ten)/gi, '');
  normalized = normalized.replace(/[Cc]hapter\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/gi, '');
  normalized = normalized.replace(/[Ss]eason\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/gi, '');
  normalized = normalized.replace(/\d+x\d+/gi, ''); // 1x01

  // Remove quality indicators
  normalized = normalized.replace(/\b(HD|4K|720p|1080p|UHD)\b/gi, '');

  // Remove common suffixes
  normalized = normalized.replace(/\b(full episode|full movie|official|new|latest)\b/gi, '');

  // Creators sometimes use only a terminal number.  Treat that as an episode
  // matching aid only when the remaining title has at least two words.
  if (/\b\d{1,3}\s*$/.test(normalized) && normalizeString(normalized.replace(/\b\d{1,3}\s*$/, '')).split(' ').length >= 2) {
    normalized = normalized.replace(/\b\d{1,3}\s*$/, '');
  }

  return normalizeString(normalized);
}

/**
 * Calculate Jaro-Winkler similarity between two strings (0–1)
 * Returns 1.0 for identical, 0.0 for completely different
 */
export function jaroWinklerSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1.0;

  // Jaro similarity calculation
  const maxLen = Math.max(s1.length, s2.length);
  const matchDistance = Math.floor(maxLen / 2) - 1;

  const s1Matches = new Array(s1.length);
  const s2Matches = new Array(s2.length);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Find transpositions
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro = (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;

  // Jaro-Winkler: boost score for matching prefixes
  let prefix = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length, 4); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

/**
 * Generate a stable hash from a string
 * Used for query deduplication and cache keys
 */
export function generateHash(input: string): string {
  if (!input) return '';

  // Simple string hash function (stable across sessions)
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(16);
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Normalize a score to 0–100
 */
export function normalizeScore(value: number, min: number, max: number): number {
  if (max <= min) return 50; // Default middle score if range is invalid

  const normalized = ((value - min) / (max - min)) * 100;
  return clamp(Math.round(normalized), 0, 100);
}

/**
 * Calculate weighted average of scores
 */
export function weightedAverage(
  scores: Record<string, number>,
  weights: Record<string, number>
): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [key, score] of Object.entries(scores)) {
    const weight = weights[key] || 0;
    if (weight > 0 && score >= 0) {
      weightedSum += score * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return 0;

  const result = weightedSum / totalWeight;
  return clamp(Math.round(result), 0, 100);
}

/**
 * Extract season number from text
 */
export function extractSeasonNumber(text: string): number | null {
  if (!text) return null;

  const patterns = [
    /[Ss](?:eason)?\s*(\d{1,2})/,
    /[Ss](\d{1,2})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > 0 && num < 100) return num;
    }
  }

  return null;
}

/**
 * Extract episode number from text
 */
export function extractEpisodeNumber(text: string): number | null {
  if (!text) return null;

  const patterns = [
    /[Ss]\d{1,2}[Ee](\d{1,2})/,
    /[Ee]pisode\s+(\d{1,3})/i,
    /[Ee]p\.?\s*(\d{1,3})/i,
    /[Pp]art\s+(\d{1,3})/i,
    /\d{1,2}x(\d{1,2})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > 0 && num < 1000) return num;
    }
  }

  return null;
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0m';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Generate a UUID-like string
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Safely parse JSON with default fallback
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Check if a URL is embeddable on YouTube
 */
export function isYouTubeEmbeddable(url: string): boolean {
  if (!url) return false;

  // Check if URL matches YouTube embeddable patterns
  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be')
  );
}

/**
 * Extract YouTube video ID from URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // Try youtu.be format
  let match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  // Try youtube.com format
  match = url.match(/youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  // Try youtube.com/embed format
  match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  return null;
}

/**
 * Extract YouTube channel ID from URL
 */
export function extractYouTubeChannelId(url: string): string | null {
  if (!url) return null;

  // Try /channel/ID format
  let match = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];

  // Try /@handle format
  match = url.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/);
  if (match) return match[1];

  return null;
}

/**
 * Convert text to slug format (lowercase, hyphens, no special chars)
 */
export function slugify(text: string): string {
  return normalizeString(text).replace(/\s+/g, '-').toLowerCase();
}

/**
 * Deduplicate an array
 */
export function deduplicate<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Group array items by a key function
 */
export function groupBy<T, K extends string | number>(
  arr: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;

  for (const item of arr) {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }

  return result;
}

/**
 * Flatten nested arrays
 */
export function flatten<T>(arr: T[][]): T[] {
  return arr.reduce((acc, val) => acc.concat(val), []);
}

/**
 * Wait for a specified number of milliseconds
 */
export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 500
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Check if a value is null or undefined
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Safely access nested object property
 */
export function getNestedValue<T>(obj: unknown, path: string, defaultValue?: T): T | undefined {
  try {
    const result = path.split('.').reduce((current: unknown, prop: string) => {
      return current && typeof current === 'object' ? (current as Record<string, unknown>)[prop] : undefined;
    }, obj);

    return result !== undefined ? (result as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Merge two objects deeply
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        ) as unknown;
      } else {
        result[key] = sourceValue as unknown;
      }
    }
  }

  return result;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Parse date safely
 */
export function parseDate(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;

  try {
    if (dateInput instanceof Date) return dateInput;
    const parsed = new Date(dateInput);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Get days since a date
 */
export function daysSince(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Convert video duration (seconds) to classification hint
 */
export function durationClassification(seconds: number): 'short' | 'medium' | 'long' | 'feature' {
  if (seconds < 10 * 60) return 'short'; // < 10 min
  if (seconds < 30 * 60) return 'medium'; // 10–30 min
  if (seconds < 60 * 60) return 'long'; // 30–60 min
  return 'feature'; // > 60 min
}

/**
 * Universal Firestore document sanitizer
 * Recursively removes any keys with `undefined` values so Firestore setDoc never throws Unsupported field value: undefined.
 */
export function sanitizeFirestoreDoc<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = sanitizeFirestoreDoc(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}
