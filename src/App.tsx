import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/hooks/use-theme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';

// Primary Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Movies from './pages/Movies';
import Series from './pages/Series';
import Watch from './pages/Watch';
import Admin from './pages/Admin';
import Favorites from './pages/Favorites';
import WatchLater from './pages/WatchLater';
import Trending from './pages/Trending';
import New from './pages/New';
import Profile from './pages/Profile';
import Search from './pages/Search';
import MovieDetail from './pages/MovieDetail';
import SeriesDetail from './pages/SeriesDetail';
import NotFound from './pages/NotFound';

// Discovery Hubs & SEO Pages
import MovieNight from './pages/MovieNight';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import Music from './pages/Music';
import MovieSoundtrack from './pages/MovieSoundtrack';
import Books from './pages/Books';
import PeopleDetail from './pages/PeopleDetail';
import Genres from './pages/Genres';
import Collections from './pages/Collections';
import PublicProfile from './pages/PublicProfile';
import WeatherAssistant from '@/components/weather/WeatherAssistant';

// Geo-Located Cinema & YouTube Discovery
import CountryMovies from './pages/CountryMovies';
import CountryMovieDetail from './pages/CountryMovieDetail';
import GeoRecommendationCard from '@/components/geo/GeoRecommendationCard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="orangeflix-theme">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="app-shell flex min-h-screen flex-col">
              <ScrollToTop />
              <Navbar />
              <main className="flex-1">
                <Routes>
                  {/* Core Platform */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/auth/action" element={<ResetPassword />} />
                  <Route path="/movies" element={<Movies />} />
                  <Route path="/series" element={<Series />} />
                  <Route path="/movie/:id" element={<MovieDetail />} />
                  <Route path="/series/:id" element={<SeriesDetail />} />
                  <Route path="/trending" element={<Trending />} />
                  <Route path="/new" element={<New />} />
                  <Route path="/watch/:id" element={<Watch />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/watchlater" element={<WatchLater />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/admin" element={<Admin />} />

                  {/* Discovery Hubs */}
                  <Route path="/movie-night" element={<MovieNight />} />
                  <Route path="/tonight" element={<MovieNight />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/news/:slug" element={<NewsDetail />} />
                  <Route path="/news/category/:category" element={<News />} />
                  <Route path="/music" element={<Music />} />
                  <Route path="/music/movie/:id" element={<MovieSoundtrack />} />
                  <Route path="/books" element={<Books />} />
                  <Route path="/people/:id" element={<PeopleDetail />} />
                  <Route path="/genres" element={<Genres />} />
                  <Route path="/genres/:slug" element={<Genres />} />
                  <Route path="/collections/:slug" element={<Collections />} />
                  <Route path="/u/:username" element={<PublicProfile />} />

                  {/* Geo-Located YouTube Movie & Series Catalogs */}
                  <Route path="/:countryCode/movies" element={<CountryMovies />} />
                  <Route path="/:countryCode/series" element={<CountryMovies />} />
                  <Route path="/:countryCode/movies/:slug" element={<CountryMovieDetail />} />
                  <Route path="/:countryCode/watch/:slug" element={<CountryMovieDetail />} />

                  {/* 404 Fallback */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <GeoRecommendationCard />
              <WeatherAssistant />
              <Footer />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
