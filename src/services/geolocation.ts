/**
 * OrangeFlix Geolocation & Visitor Location Adapter
 * Uses true IP Geolocation for country detection. Never stores visitor IP addresses.
 */

import { getCountryConfig } from '@/features/geo/countryConfig';

const GEO_STORAGE_KEY = 'orangeflix_geo_country';
const LANG_STORAGE_KEY = 'orangeflix_geo_language';
const POPUP_DISMISSED_KEY = 'orangeflix_geo_popup_dismissed_until';

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Africa/Kigali': 'RW',
  'Africa/Nairobi': 'KE',
  'Africa/Lagos': 'NG',
  'Africa/Accra': 'GH',
  'Africa/Dar_es_Salaam': 'TZ',
  'Africa/Kampala': 'UG',
  'Africa/Johannesburg': 'ZA',
  'Africa/Kinshasa': 'RW',
  'Africa/Lubumbashi': 'RW',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'Europe/London': 'US',
  'Europe/Paris': 'RW',
};

export interface DetectedLocation {
  countryCode: string;
  countryName: string;
  flag: string;
  defaultLanguage: string;
  isDetected: boolean;
}

export const GeolocationService = {
  /** Detect approximate country using real IP geolocation, timezone heuristics, or manual override */
  async detectVisitorCountry(): Promise<DetectedLocation> {
    // 1. Check local storage override first
    const saved = this.getUserCountry();
    if (saved) {
      const config = getCountryConfig(saved);
      return {
        countryCode: config.countryCode,
        countryName: config.name,
        flag: config.flagEmoji,
        defaultLanguage: config.defaultLanguage,
        isDetected: false,
      };
    }

    // 2. Perform live IP Geolocation query (Privacy safe: do not store IP)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Primary IP Geo service: country.is (Fast, HTTPS, CORS-friendly)
      const res = await fetch('https://api.country.is/', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = (await res.json()) as { country?: string };
        if (data.country && data.country.length === 2) {
          const config = getCountryConfig(data.country);
          return {
            countryCode: config.countryCode,
            countryName: config.name,
            flag: config.flagEmoji,
            defaultLanguage: config.defaultLanguage,
            isDetected: true,
          };
        }
      }
    } catch {
      // IP lookup fallback
    }

    // 3. Secondary fallback: Timezone mapping
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && TIMEZONE_TO_COUNTRY[tz]) {
        const countryCode = TIMEZONE_TO_COUNTRY[tz];
        const config = getCountryConfig(countryCode);
        return {
          countryCode: config.countryCode,
          countryName: config.name,
          flag: config.flagEmoji,
          defaultLanguage: config.defaultLanguage,
          isDetected: true,
        };
      }
    } catch {
      // Fallback
    }

    // 4. Default fallback: Rwanda (RW)
    const fallbackConfig = getCountryConfig('RW');
    return {
      countryCode: fallbackConfig.countryCode,
      countryName: fallbackConfig.name,
      flag: fallbackConfig.flagEmoji,
      defaultLanguage: fallbackConfig.defaultLanguage,
      isDetected: true,
    };
  },

  getUserCountry(): string | null {
    try {
      return localStorage.getItem(GEO_STORAGE_KEY);
    } catch {
      return null;
    }
  },

  setUserCountry(countryCode: string): void {
    try {
      localStorage.setItem(GEO_STORAGE_KEY, countryCode.toUpperCase());
    } catch {
      // Ignore
    }
  },

  getUserLanguage(): string {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved) return saved;

      // Check browser languages
      const navLang = navigator.language.split('-')[0].toLowerCase();
      if (['rw', 'en', 'fr', 'sw'].includes(navLang)) {
        return navLang;
      }
      return 'rw'; // Default to Kinyarwanda for primary regional experience
    } catch {
      return 'rw';
    }
  },

  setUserLanguage(lang: string): void {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang.toLowerCase());
    } catch {
      // Ignore
    }
  },

  hasDismissedPopup(): boolean {
    try {
      const dismissedUntil = localStorage.getItem(POPUP_DISMISSED_KEY);
      if (!dismissedUntil) return false;
      return Date.now() < parseInt(dismissedUntil, 10);
    } catch {
      return false;
    }
  },

  dismissPopup(durationDays: number = 7): void {
    try {
      const until = Date.now() + durationDays * 86400000;
      localStorage.setItem(POPUP_DISMISSED_KEY, String(until));
    } catch {
      // Ignore
    }
  },
};
