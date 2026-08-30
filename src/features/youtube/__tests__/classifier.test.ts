/**
 * Unit Tests for YouTube Classifier, Duration Parser, and Multi-Country Relevance
 */

import { parseYouTubeDuration, formatDurationSeconds } from '../duration';
import { classifyYouTubeVideo, computeCountryRelevance, computeRwandaRelevance } from '../classifier';

describe('YouTube Duration Parser', () => {
  it('correctly parses complex ISO-8601 duration strings', () => {
    expect(parseYouTubeDuration('PT1H42M15S').seconds).toBe(6135);
    expect(parseYouTubeDuration('PT2H5M53S').seconds).toBe(7553);
    expect(parseYouTubeDuration('PT1H7M43S').seconds).toBe(4063);
    expect(parseYouTubeDuration('PT1H13M28S').seconds).toBe(4408);
    expect(parseYouTubeDuration('PT42M31S').seconds).toBe(2551);
  });

  it('handles empty and malformed durations gracefully', () => {
    expect(parseYouTubeDuration('').seconds).toBe(0);
    expect(formatDurationSeconds(0)).toBe('0m');
  });
});

describe('Multi-Country YouTube Classification', () => {
  it('classifies Rwandan movie with country relevance', () => {
    const res = classifyYouTubeVideo({
      title: 'BROKEN|| RWANDAN FULL MOVIE 2026',
      durationSeconds: 4800,
      channelTrust: 'approved',
      countryCode: 'RW',
    });
    expect(res.contentType).toBe('movie');
    expect(res.isFullMovieCandidate).toBe(true);
    expect(res.countryScore).toBeGreaterThanOrEqual(15);
  });

  it('classifies Ugandan movie with Uganda country relevance and terms', () => {
    const res = classifyYouTubeVideo({
      title: 'DECEITFUL LOVE - Latest uganda movie 2025 (Full Movie)',
      durationSeconds: 5100,
      channelTrust: 'approved',
      countryCode: 'UG',
    });
    expect(res.contentType).toBe('movie');
    expect(res.isFullMovieCandidate).toBe(true);
    expect(res.countryScore).toBeGreaterThanOrEqual(30);
  });

  it('classifies Nigerian Nollywood movie with Nigeria country relevance', () => {
    const res = classifyYouTubeVideo({
      title: 'BEAUTY OF US (Full Movie) - 2026 Latest Nollywood New Movie',
      durationSeconds: 7200,
      channelTrust: 'pending',
      countryCode: 'NG',
    });
    expect(res.contentType).toBe('movie');
    expect(res.isFullMovieCandidate).toBe(true);
    expect(res.countryScore).toBeGreaterThanOrEqual(30);
  });

  it('classifies Kenyan Riverwood movie with Kenya country relevance', () => {
    const res = classifyYouTubeVideo({
      title: 'NAIROBI HALF LIFE | Best Kenyan Riverwood Movie in English',
      durationSeconds: 6000,
      channelTrust: 'pending',
      countryCode: 'KE',
    });
    expect(res.contentType).toBe('movie');
    expect(res.isFullMovieCandidate).toBe(true);
    expect(res.countryScore).toBeGreaterThanOrEqual(30);
  });

  it('classifies "TRAILER" as trailer with negative penalty', () => {
    const res = classifyYouTubeVideo({
      title: 'Official TRAILER HD',
      durationSeconds: 120,
      countryCode: 'UG',
    });
    expect(res.contentType).toBe('trailer');
    expect(res.isFullMovieCandidate).toBe(false);
  });

  it('classifies "S01 EP1" as episode', () => {
    const res = classifyYouTubeVideo({
      title: 'CINDY : S01 EP1 - Ugandan Series',
      durationSeconds: 2700,
      countryCode: 'UG',
    });
    expect(res.contentType).toBe('episode');
    expect(res.isFullMovieCandidate).toBe(false);
  });

  it('rejects YouTube Shorts', () => {
    const res = classifyYouTubeVideo({
      title: 'Funny scene #shorts',
      durationSeconds: 45,
      countryCode: 'UG',
    });
    expect(res.isFullMovieCandidate).toBe(false);
  });
});

describe('Country Relevance Engine', () => {
  it('computes high relevance for Uganda keywords', () => {
    const res = computeCountryRelevance('Wakaliwood Ramon Film Production - VJ Emmy Luganda Movie', 'UG');
    expect(res.score).toBeGreaterThanOrEqual(50);
    expect(res.matchedKeywords).toContain('wakaliwood action cinema');
  });

  it('computes high relevance for Nigeria keywords', () => {
    const res = computeCountryRelevance('Latest Nollywood Yoruba Full Movie in Lagos', 'NG');
    expect(res.score).toBeGreaterThanOrEqual(50);
    expect(res.matchedKeywords).toContain('nollywood');
  });
});
