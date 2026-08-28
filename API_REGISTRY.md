# OrangeFlix API Ecosystem & Technical Registry

This document defines the external APIs and data adapters powering OrangeFlix, their authentication models, rate limits, caching mechanisms, fallback resilience strategies, and exact implementation status.

---

## 1. TMDB API (The Movie Database) — Primary Movie & Series Metadata

- **Status**: `Implemented`
- **Provider**: The Movie Database (TMDB)
- **Official Documentation**: [https://developer.themoviedb.org/docs](https://developer.themoviedb.org/docs)
- **Purpose**: Movies, TV Shows, Seasons, Episodes, Credits (Actors/Directors), Trailers, High-Resolution Backdrops, Search, and Candidate generation.
- **Authentication**: Bearer Token / API Key (`VITE_TMDB_ACCESS_TOKEN` / `VITE_TMDB_API_KEY`).
- **Endpoints Used**:
  - `GET /trending/{media_type}/{time_window}`
  - `GET /movie/{movie_id}` (includes videos, credits, similar)
  - `GET /tv/{series_id}` (includes seasons, episodes, cast)
  - `GET /person/{person_id}` & `GET /person/{person_id}/combined_credits`
  - `GET /search/multi`
  - `GET /discover/movie` & `GET /discover/tv`
- **Rate Limits**: 50 requests per second.
- **Caching Strategy**: `@tanstack/react-query` with 5-minute stale times and 24-hour cache for genres.
- **Fallback Behavior**: Local curated catalog in `src/lib/movies.ts` and Firestore custom catalog.

---

## 2. Apple iTunes Search API — Music & Soundtracks

- **Status**: `Implemented`
- **Provider**: Apple iTunes Search API
- **Official Documentation**: [https://performance-partners.apple.com/search-api](https://performance-partners.apple.com/search-api)
- **Purpose**: Official motion picture soundtrack albums, track titles, artist names, album covers (600x600 HD), and 30-second audio preview streaming in both `/music` and movie detail pages.
- **Authentication**: None required (100% Free, Public API).
- **Endpoints Used**:
  - `GET https://itunes.apple.com/search?term={title}+soundtrack&entity=song,album&limit=15`
- **CORS Support**: Full client-side browser CORS enabled.
- **Rate Limits**: ~20 calls/min per IP.
- **Caching Strategy**: In-memory and React Query caching.
- **Fallback Behavior**: Gracefully returns empty array or curated soundtrack credits.

---

## 3. Open-Meteo Weather & Geocoding API — Weather-Aware Discovery

- **Status**: `Implemented`
- **Provider**: Open-Meteo
- **Official Documentation**: [https://open-meteo.com/en/docs](https://open-meteo.com/en/docs)
- **Purpose**: Weather-based mood discovery for `/movie-night`, `/tonight`, and floating `WeatherAssistant` edge overlay.
- **Authentication**: None required (Open Source & Free).
- **Endpoints Used**:
  - `GET https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1`
  - `GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,is_day,weather_code`
- **CORS Support**: Full CORS enabled.
- **Rate Limits**: Up to 10,000 requests/day.
- **Fallback Behavior**: Defaults to regional evening weather preset (22°C, pleasant atmosphere).

---

## 4. Open Library Search API — Books & Literary Adaptations

- **Status**: `Implemented`
- **Provider**: Internet Archive / Open Library
- **Official Documentation**: [https://openlibrary.org/developers/api](https://openlibrary.org/developers/api)
- **Purpose**: Literary source material discovery (`/books` and detail pages) for movies and series adapted from novels and biographies.
- **Authentication**: None required (100% Open Access).
- **Endpoints Used**:
  - `GET https://openlibrary.org/search.json?q={title}&limit=6`
  - `GET https://covers.openlibrary.org/b/id/{cover_id}-L.jpg`
- **CORS Support**: Full CORS enabled.
- **Fallback Behavior**: Curated verified adaptation catalog with synopsis and cover art.

---

## 5. OrangeFlix News Wire & Editorial Adapter

- **Status**: `Implemented`
- **Provider**: OrangeFlix Editorial Wire Adapter
- **Purpose**: Industry updates, casting announcements, festival awards, 4K streaming technology reviews, and trailer breakdowns (`/news` and detail pages).
- **Data Model**: Full markdown content, category taxonomy (`Movies`, `TV`, `Streaming`, `Trailers`, `Awards`, `Industry`), author metadata, and catalog entity links.

---

## 6. First-Party Analytics Pipeline & Aggregation

- **Status**: `Implemented`
- **Provider**: OrangeFlix Analytics Pipeline (`src/services/analytics.ts`)
- **Purpose**: Real-time event logging (`page_view`, `movie_view`, `watch_start`, `watch_progress`, `watch_complete`, `search`, `recommendation_click`, `weather_recommendation_click`), DAU/WAU/MAU calculations, real discovery funnel conversions, retention cohorts, and recommendation CTR.
- **Data Storage**: Local fast buffer + Firestore `activityLogs` collection.

---

## 7. Google Identity Services (GIS) & Firebase Authentication

- **Status**: `Implemented`
- **Provider**: Google Identity & Firebase Auth
- **Purpose**: Unified account authentication, Google Sign-In popup, Google One Tap frictionless login, and credential linking.
- **Security & Privacy**: Zero sensitive credential exposure; canonical Firebase UID system guarantees 1 user account across authentication methods.

---

## 8. Google Search Console & Indexing API

- **Status**: `Not configured` (Planned for post-deployment production domain verification)
