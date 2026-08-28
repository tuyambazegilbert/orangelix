/**
 * OrangeFlix Weather & Mood Recommendation Adapter
 * Powered by Open-Meteo Weather & Geocoding API (100% Free, Open Source, No API Key Required)
 */

export interface WeatherCondition {
  temperature: number; // Celsius
  conditionText: string;
  condition: string;
  isDay: boolean;
  weatherCode: number;
  city: string;
  country: string;
  countryCode: string;
  recommendedGenres: string[];
  moodTitle: string;
  moodCategory: string;
  moodDescription: string;
}

export type WeatherData = WeatherCondition;

export const WeatherApi = {
  getWeatherCodeDescription(code: number): { text: string; mood: string; genres: string[] } {
    if (code === 0) {
      return {
        text: 'Clear Sky',
        mood: 'Starlit Cinema Night',
        genres: ['Action', 'Adventure', 'Science Fiction'],
      };
    }
    if (code >= 1 && code <= 3) {
      return {
        text: 'Partly Cloudy',
        mood: 'Relaxed Evening Streaming',
        genres: ['Drama', 'Comedy', 'Thriller'],
      };
    }
    if (code >= 45 && code <= 48) {
      return {
        text: 'Misty & Foggy',
        mood: 'Moody Mystery Atmosphere',
        genres: ['Mystery', 'Thriller', 'Crime'],
      };
    }
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      return {
        text: 'Rainy',
        mood: 'Cozy Rainy Night',
        genres: ['Science Fiction', 'Drama', 'Thriller', 'Mystery'],
      };
    }
    if (code >= 71 && code <= 77) {
      return {
        text: 'Snowy & Cold',
        mood: 'Winter Blanket Binge',
        genres: ['Fantasy', 'Animation', 'Adventure', 'Family'],
      };
    }
    if (code >= 95 && code <= 99) {
      return {
        text: 'Thunderstorm',
        mood: 'Intense Storm Drama',
        genres: ['Horror', 'Thriller', 'Action', 'Crime'],
      };
    }
    return {
      text: 'Mild Atmosphere',
      mood: 'Prime Movie Night',
      genres: ['Action', 'Drama', 'Science Fiction'],
    };
  },

  async getWeatherByCity(cityName: string = 'Kigali'): Promise<WeatherCondition> {
    try {
      // 1. Geocode city name
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
      );
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        return this.getFallbackWeather(cityName);
      }

      const location = geoData.results[0];
      const lat = location.latitude;
      const lon = location.longitude;
      const city = location.name;
      const country = location.country || 'Rwanda';
      const countryCode = location.country_code || 'RW';

      // 2. Fetch current weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,is_day,weather_code&timezone=auto`
      );
      const weatherData = await weatherRes.json();
      const current = weatherData.current;

      const weatherCode = current?.weather_code ?? 0;
      const temperature = Math.round(current?.temperature_2m ?? 22);
      const isDay = Boolean(current?.is_day);
      const moodInfo = this.getWeatherCodeDescription(weatherCode);

      return {
        temperature,
        conditionText: moodInfo.text,
        condition: moodInfo.text,
        isDay,
        weatherCode,
        city,
        country,
        countryCode,
        recommendedGenres: moodInfo.genres,
        moodTitle: moodInfo.mood,
        moodCategory: moodInfo.mood,
        moodDescription: `${temperature}°C with ${moodInfo.text.toLowerCase()} in ${city}. The perfect atmosphere for ${moodInfo.genres.join(', ')}.`,
      };
    } catch (err) {
      console.warn('[WeatherApi] Fetch failed, using fallback:', err);
      return this.getFallbackWeather(cityName);
    }
  },

  async getLiveWeather(cityName: string = 'Kigali'): Promise<WeatherCondition> {
    return this.getWeatherByCity(cityName);
  },

  getFallbackWeather(cityName: string = 'Kigali'): WeatherCondition {
    return {
      temperature: 22,
      conditionText: 'Pleasant Evening',
      condition: 'Pleasant Evening',
      isDay: false,
      weatherCode: 1,
      city: cityName,
      country: 'Rwanda',
      countryCode: 'RW',
      recommendedGenres: ['Science Fiction', 'Drama', 'Thriller'],
      moodTitle: 'Prime Movie Night',
      moodCategory: 'Prime Movie Night',
      moodDescription: `22°C with pleasant skies in ${cityName}. Ideal time for unforgettable cinema.`,
    };
  },
};
