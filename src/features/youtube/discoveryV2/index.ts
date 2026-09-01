/**
 * OrangeFlix Discovery V2 — Public Exports
 */

export * from './types';
export * from './constants';
export * from './utils';
export * from './scoring';
export * from './queryGenerator';
export * from './profiles';
// Keep both scoring APIs available without an ambiguous barrel export.
export {
  analyzeCountryEvidence,
  analyzeAllCountries,
  detectCountryConflict,
  calculateCountryScore as calculateEvidenceCountryScore,
} from './geoAnalyzer';
export type { CountryEvidence } from './geoAnalyzer';
export * from './contentClassifier';
export * from './seriesResolver';
export * from './channelAnalyzer';
export * from './publicationEngine';
export * from './discoveryEngine';
export * from './adapters';
