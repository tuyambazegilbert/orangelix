/**
 * OrangeFlix Discovery V2 — Geo Analyzer
 * Advanced country/territory detection with multi-source evidence
 */

import { DiscoveryEvidence } from './types';
import { COUNTRY_SCORE_IMPACTS } from './constants';
import { normalizeString, clamp } from './utils';

export interface CountryEvidence {
  countryCode: string;
  confidence: number; // 0–100
  evidence: string[];
  sources: string[];
}

/**
 * Analyze multiple sources for country evidence
 */
export function analyzeCountryEvidence(
  countryCode: string,
  title: string,
  description: string,
  channelCountry?: string,
  channelDescription?: string,
  language?: string,
  tags?: string[]
): CountryEvidence {
  const evidence: string[] = [];
  const sources: string[] = [];
  let confidence = 30; // Base confidence

  const titleLower = (title || '').toLowerCase();
  const descLower = (description || '').toLowerCase();
  const channelDescLower = (channelDescription || '').toLowerCase();

  // Country metadata mapping
  const countryMetadata: Record<string, { names: string[]; demonyms: string[]; cities: string[] }> = {
    RW: {
      names: ['rwanda'],
      demonyms: ['rwandan'],
      cities: ['kigali'],
    },
    UG: {
      names: ['uganda'],
      demonyms: ['ugandan'],
      cities: ['kampala', 'entebbe'],
    },
    KE: {
      names: ['kenya'],
      demonyms: ['kenyan'],
      cities: ['nairobi', 'mombasa'],
    },
    NG: {
      names: ['nigeria'],
      demonyms: ['nigerian'],
      cities: ['lagos', 'abuja', 'enugu'],
    },
    GH: {
      names: ['ghana'],
      demonyms: ['ghanaian'],
      cities: ['accra', 'kumasi'],
    },
    TZ: {
      names: ['tanzania'],
      demonyms: ['tanzanian'],
      cities: ['dar es salaam', 'arusha', 'zanzibar'],
    },
    ZA: {
      names: ['south africa', 'south african'],
      demonyms: ['south african'],
      cities: ['johannesburg', 'cape town', 'durban'],
    },
    US: {
      names: ['united states', 'usa', 'america'],
      demonyms: ['american'],
      cities: ['new york', 'los angeles'],
    },
  };

  const metadata = countryMetadata[countryCode];
  if (!metadata) {
    return { countryCode, confidence: 0, evidence: [], sources: [] };
  }

  // Check title
  for (const name of metadata.names) {
    if (titleLower.includes(name)) {
      evidence.push(`Title contains "${name}"`);
      sources.push('title');
      confidence += 20;
    }
  }
  for (const demonym of metadata.demonyms) {
    if (titleLower.includes(demonym)) {
      evidence.push(`Title contains demonym "${demonym}"`);
      sources.push('title');
      confidence += 25;
    }
  }
  for (const city of metadata.cities) {
    if (titleLower.includes(city)) {
      evidence.push(`Title mentions city "${city}"`);
      sources.push('title');
      confidence += 15;
    }
  }

  // Check description
  for (const demonym of metadata.demonyms) {
    if (descLower.includes(demonym)) {
      evidence.push(`Description contains demonym "${demonym}"`);
      sources.push('description');
      confidence += 15;
    }
  }

  // Check channel metadata
  if (channelCountry === countryCode) {
    evidence.push(`Channel country matches: ${countryCode}`);
    sources.push('channel_country');
    confidence += 30;
  }

  if (channelDescLower && metadata.demonyms.some(d => channelDescLower.includes(d))) {
    evidence.push('Channel description indicates target country');
    sources.push('channel_description');
    confidence += 20;
  }

  // Check language
  const languageCountryMap: Record<string, string[]> = {
    rw: ['RW'],
    lg: ['UG'],
    sw: ['KE', 'TZ', 'UG'],
    yo: ['NG'],
    twi: ['GH'],
    zu: ['ZA'],
    xh: ['ZA'],
    af: ['ZA'],
  };

  if (language && languageCountryMap[language.toLowerCase()]?.includes(countryCode)) {
    evidence.push(`Language "${language}" associated with ${countryCode}`);
    sources.push('language');
    confidence += 25;
  }

  // Check tags
  if (tags) {
    for (const tag of tags) {
      const tagLower = tag.toLowerCase();
      for (const demonym of metadata.demonyms) {
        if (tagLower.includes(demonym)) {
          evidence.push(`Tag contains "${demonym}"`);
          sources.push('tags');
          confidence += 10;
        }
      }
    }
  }

  // Cinema ecosystem indicators
  const cinemaIndicators: Record<string, string[]> = {
    RW: ['nollywood', 'rwandan cinema'],
    UG: ['wakaliwood', 'uganda cinema'],
    KE: ['riverwood', 'kenyan cinema'],
    NG: ['nollywood'],
    GH: ['ghallywood', 'kumawood'],
    TZ: ['bongo movie'],
    ZA: ['mzansi magic'],
  };

  if (cinemaIndicators[countryCode]) {
    for (const indicator of cinemaIndicators[countryCode]) {
      if (titleLower.includes(indicator) || descLower.includes(indicator)) {
        evidence.push(`Cinema indicator: "${indicator}"`);
        sources.push('cinema_ecosystem');
        confidence += 20;
      }
    }
  }

  return {
    countryCode,
    confidence: clamp(Math.round(confidence), 0, 100),
    evidence,
    sources: Array.from(new Set(sources)),
  };
}

/**
 * Detect conflicting country evidence
 */
export function detectCountryConflict(
  primaryCountry: string,
  otherCountries: CountryEvidence[]
): { hasConflict: boolean; conflictingCountries: string[]; severity: 'low' | 'medium' | 'high' } {
  const conflictingCountries = otherCountries
    .filter(c => c.countryCode !== primaryCountry && c.confidence > 70)
    .map(c => c.countryCode);

  if (conflictingCountries.length === 0) {
    return { hasConflict: false, conflictingCountries: [], severity: 'low' };
  }

  const severity = conflictingCountries.length > 2 ? 'high' : conflictingCountries.length > 1 ? 'medium' : 'low';

  return {
    hasConflict: true,
    conflictingCountries,
    severity,
  };
}

/**
 * Calculate overall country score considering all evidence
 */
export function calculateCountryScore(
  evidence: CountryEvidence,
  conflict: { hasConflict: boolean; severity: 'low' | 'medium' | 'high' }
): number {
  let score = evidence.confidence;

  // Penalty for conflicting country evidence
  if (conflict.hasConflict) {
    if (conflict.severity === 'high') {
      score -= 40;
    } else if (conflict.severity === 'medium') {
      score -= 20;
    } else {
      score -= 10;
    }
  }

  return clamp(Math.round(score), 0, 100);
}

/**
 * Analyze all possible countries for a video
 */
export function analyzeAllCountries(
  title: string,
  description: string,
  channelCountry?: string,
  channelDescription?: string,
  language?: string,
  tags?: string[]
): CountryEvidence[] {
  const countries = ['RW', 'UG', 'KE', 'NG', 'GH', 'TZ', 'ZA', 'US'];
  const results: CountryEvidence[] = [];

  for (const country of countries) {
    const evidence = analyzeCountryEvidence(country, title, description, channelCountry, channelDescription, language, tags);
    if (evidence.confidence > 0) {
      results.push(evidence);
    }
  }

  // Sort by confidence
  results.sort((a, b) => b.confidence - a.confidence);

  return results;
}

/**
 * Detect language from content
 */
export function detectLanguage(
  title: string,
  description: string,
  channelCountry?: string
): Array<{ code: string; confidence: number }> {
  const languages: Record<string, { keywords: string[]; countries: string[] }> = {
    rw: {
      keywords: ['kinyarwanda', 'filime nyarwanda', 'agasobanuye', 'urukundo'],
      countries: ['RW'],
    },
    lg: {
      keywords: ['luganda', 'vj emmy', 'wakaliwood'],
      countries: ['UG'],
    },
    sw: {
      keywords: ['kiswahili', 'swahili', 'filamu za kiswahili'],
      countries: ['KE', 'TZ', 'UG'],
    },
    yo: {
      keywords: ['yoruba', 'yorubahood'],
      countries: ['NG'],
    },
    twi: {
      keywords: ['twi', 'kumawood'],
      countries: ['GH'],
    },
    zu: {
      keywords: ['zulu', 'mzansi'],
      countries: ['ZA'],
    },
    xh: {
      keywords: ['xhosa'],
      countries: ['ZA'],
    },
    af: {
      keywords: ['afrikaans', 'south african'],
      countries: ['ZA'],
    },
  };

  const detected: Array<{ code: string; confidence: number }> = [];
  const titleLower = (title || '').toLowerCase();
  const descLower = (description || '').toLowerCase();

  for (const [code, config] of Object.entries(languages)) {
    let confidence = 0;

    for (const keyword of config.keywords) {
      if (titleLower.includes(keyword)) confidence += 30;
      if (descLower.includes(keyword)) confidence += 20;
    }

    if (channelCountry && config.countries.includes(channelCountry)) {
      confidence += 15;
    }

    if (confidence > 0) {
      detected.push({ code, confidence: clamp(confidence, 0, 100) });
    }
  }

  detected.sort((a, b) => b.confidence - a.confidence);
  return detected;
}

/**
 * Create geo evidence objects for storage
 */
export function createGeoEvidence(
  evidence: CountryEvidence,
  dimension: 'country' | 'language' | 'region'
): DiscoveryEvidence {
  return {
    dimension: 'country',
    source: 'geo_analyzer',
    value: evidence.countryCode,
    confidence: evidence.confidence,
    timestamp: new Date(),
  };
}
