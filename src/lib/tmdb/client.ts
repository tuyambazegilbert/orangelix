class TMDBClient {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = (import.meta.env.VITE_TMDB_BASE_URL || 'https://api.themoviedb.org/3').replace(/\/$/, '');
    this.token = import.meta.env.VITE_TMDB_ACCESS_TOKEN || '';
  }

  public hasToken(): boolean {
    return Boolean(this.token && this.token.trim().length > 0 && this.token !== 'your_tmdb_bearer_read_access_token_here');
  }

  public async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined | null>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (this.hasToken()) {
      headers['Authorization'] = `Bearer ${this.token.trim()}`;
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        let errorMessage = `TMDB API error (${response.status}): ${response.statusText}`;
        try {
          const errorJson = await response.json();
          if (errorJson.status_message) {
            errorMessage = errorJson.status_message;
          }
        } catch {
          // Response was not JSON
        }
        throw new Error(errorMessage);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected network error occurred while contacting TMDB');
    }
  }
}

export const tmdbClient = new TMDBClient();

