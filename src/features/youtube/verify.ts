/**
 * Automated Verification Script for YouTube Geo Discovery
 * Conforms to multi-country (RW, UG, KE, NG) test suite.
 */

import { parseYouTubeDuration } from './duration';
import { classifyYouTubeVideo, computeCountryRelevance, computeRwandaRelevance } from './classifier';

export function runVerification(): boolean {
  console.log('=== RUNNING YOUTUBE GEO DISCOVERY VERIFICATION ===');

  // Test 1: Duration Parser
  const d1 = parseYouTubeDuration('PT1H42M15S');
  if (d1.seconds !== 6135 || d1.formatted !== '1h 42m') {
    throw new Error(`Duration parser failed on PT1H42M15S: ${JSON.stringify(d1)}`);
  }
  const d2 = parseYouTubeDuration('PT2H5M53S');
  if (d2.seconds !== 7553 || d2.formatted !== '2h 05m') {
    throw new Error(`Duration parser failed on PT2H5M53S: ${JSON.stringify(d2)}`);
  }
  const d3 = parseYouTubeDuration('PT1H7M43S');
  if (d3.seconds !== 4063 || d3.formatted !== '1h 07m') {
    throw new Error(`Duration parser failed on PT1H7M43S: ${JSON.stringify(d3)}`);
  }
  const d4 = parseYouTubeDuration('PT1H13M28S');
  if (d4.seconds !== 4408 || d4.formatted !== '1h 13m') {
    throw new Error(`Duration parser failed on PT1H13M28S: ${JSON.stringify(d4)}`);
  }
  const d5 = parseYouTubeDuration('PT42M31S');
  if (d5.seconds !== 2551 || d5.formatted !== '42m') {
    throw new Error(`Duration parser failed on PT42M31S: ${JSON.stringify(d5)}`);
  }
  console.log('✓ Duration Parser: PASSED (PT1H42M15S=6135, PT2H5M53S=7553, PT1H7M43S=4063, PT1H13M28S=4408, PT42M31S=2551)');

  // Test 2: "RWANDAN FULL MOVIE + 1h20m"
  const c1 = classifyYouTubeVideo({
    title: 'BROKEN|| RWANDAN FULL MOVIE 2026',
    durationSeconds: 4800,
    channelTrust: 'approved',
    countryCode: 'RW',
  });
  if (!c1.isFullMovieCandidate || c1.contentType !== 'movie') {
    throw new Error(`"RWANDAN FULL MOVIE" failed: ${JSON.stringify(c1)}`);
  }
  console.log(`✓ Rwanda Movie ("RWANDAN FULL MOVIE + 1h20m"): PASSED (Score: ${c1.score}, CountryScore: ${c1.countryScore})`);

  // Test 3: "UGANDA FULL MOVIE + 1h25m"
  const cUg = classifyYouTubeVideo({
    title: 'DECEITFUL LOVE - Latest uganda movie 2025 (Full Movie)',
    durationSeconds: 5100, // 1h 25m
    channelTrust: 'approved',
    countryCode: 'UG',
  });
  if (!cUg.isFullMovieCandidate || cUg.contentType !== 'movie' || cUg.countryScore < 15) {
    throw new Error(`"UGANDA FULL MOVIE" failed: ${JSON.stringify(cUg)}`);
  }
  console.log(`✓ Uganda Movie ("DECEITFUL LOVE + 1h25m"): PASSED (Score: ${cUg.score}, CountryScore: ${cUg.countryScore})`);

  // Test 4: "NOLLYWOOD FULL MOVIE + 2h"
  const cNg = classifyYouTubeVideo({
    title: 'BEAUTY OF US (Full Movie) - 2026 Latest Nollywood New Movie',
    durationSeconds: 7200, // 2h
    channelTrust: 'pending',
    countryCode: 'NG',
  });
  if (!cNg.isFullMovieCandidate || cNg.contentType !== 'movie' || cNg.countryScore < 20) {
    throw new Error(`"NOLLYWOOD FULL MOVIE" failed: ${JSON.stringify(cNg)}`);
  }
  console.log(`✓ Nigeria Movie ("NOLLYWOOD FULL MOVIE + 2h"): PASSED (Score: ${cNg.score}, CountryScore: ${cNg.countryScore})`);

  // Test 5: "KENYA RIVERWOOD MOVIE + 1h40m"
  const cKe = classifyYouTubeVideo({
    title: 'NAIROBI HALF LIFE | Best Kenyan Riverwood Movie in English',
    durationSeconds: 6000, // 1h 40m
    channelTrust: 'pending',
    countryCode: 'KE',
  });
  if (!cKe.isFullMovieCandidate || cKe.contentType !== 'movie' || cKe.countryScore < 20) {
    throw new Error(`"KENYA RIVERWOOD MOVIE" failed: ${JSON.stringify(cKe)}`);
  }
  console.log(`✓ Kenya Movie ("NAIROBI HALF LIFE + 1h40m"): PASSED (Score: ${cKe.score}, CountryScore: ${cKe.countryScore})`);

  // Test 6: "TRAILER + 2m"
  const c2 = classifyYouTubeVideo({
    title: 'Bwiza 2 - Official TRAILER HD',
    durationSeconds: 120,
    channelTrust: 'approved',
    countryCode: 'RW',
  });
  if (c2.isFullMovieCandidate || c2.contentType !== 'trailer') {
    throw new Error(`"TRAILER" rejection failed: ${JSON.stringify(c2)}`);
  }
  console.log(`✓ "TRAILER + 2m": PASSED (Type: ${c2.contentType}, Score: ${c2.score})`);

  // Test 7: "S01 EP1 + 45m" Episode Detection
  const c3 = classifyYouTubeVideo({
    title: 'CINDY : S01 EP1 - Ugandan Series',
    durationSeconds: 2700,
    channelTrust: 'approved',
    countryCode: 'UG',
  });
  if (c3.isFullMovieCandidate || c3.contentType !== 'episode') {
    throw new Error(`"S01 EP1" episode detection failed: ${JSON.stringify(c3)}`);
  }
  console.log(`✓ "S01 EP1 + 45m": PASSED (Type: ${c3.contentType})`);

  // Test 8: "YouTube Short"
  const c5 = classifyYouTubeVideo({
    title: 'Funny scene #shorts',
    durationSeconds: 45,
    countryCode: 'UG',
  });
  if (c5.isFullMovieCandidate) {
    throw new Error(`"YouTube Short" failed: ${JSON.stringify(c5)}`);
  }
  console.log(`✓ "YouTube Short": PASSED`);

  // Test 9: Channel Trust
  const trustApp = classifyYouTubeVideo({
    title: 'Full Movie - Filime Nyarwanda Yose',
    durationSeconds: 5400,
    channelTrust: 'approved',
    countryCode: 'RW',
  });
  const trustRej = classifyYouTubeVideo({
    title: 'Full Movie - Filime Nyarwanda Yose',
    durationSeconds: 5400,
    channelTrust: 'rejected',
    countryCode: 'RW',
  });
  if (!trustApp.isFullMovieCandidate || trustRej.isFullMovieCandidate) {
    throw new Error('Channel trust isolation test failed');
  }
  console.log(`✓ Channel Trust (Approved vs Rejected): PASSED`);

  console.log('=== ALL MULTI-COUNTRY VERIFICATION CHECKS PASSED ===');
  return true;
}
