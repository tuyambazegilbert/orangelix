/**
 * ISO-8601 Duration Parser for YouTube Video Metadata
 * Converts strings like "PT1H42M15S" into total seconds and human-readable formatting.
 */

export function parseYouTubeDuration(durationIso: string): { seconds: number; formatted: string } {
  if (!durationIso || typeof durationIso !== 'string') {
    return { seconds: 0, formatted: '0m' };
  }

  // Regex pattern for ISO-8601 duration: P(n)Y(n)M(n)DT(n)H(n)M(n)S
  const matches = durationIso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!matches) {
    return { seconds: 0, formatted: '0m' };
  }

  const days = parseInt(matches[1] || '0', 10);
  const hours = parseInt(matches[2] || '0', 10);
  const minutes = parseInt(matches[3] || '0', 10);
  const seconds = parseInt(matches[4] || '0', 10);

  const totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds;

  return {
    seconds: totalSeconds,
    formatted: formatDurationSeconds(totalSeconds),
  };
}

export function formatDurationSeconds(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0m';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }

  return `${Math.max(1, minutes)}m`;
}

