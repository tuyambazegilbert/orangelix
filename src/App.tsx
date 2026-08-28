import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/hooks/use-theme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
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
          <BrowserRouter>
            <div className="app-shell flex min-h-screen flex-col">
              <ScrollToTop />
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/movies" element={<Movies />} />
                  <Route path="/series" element={<Series />} />
                  <Route path="/movie/:id" element={<MovieDetail />} />
                  <Route path="/series/:id" element={<SeriesDetail />} />
                  <Route path="/trending" element={<Trending />} />
                  <Route path="/new" element={<New />} />
                  <Route path="/watch/:id" element={<Watch />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/watchlater" element={<WatchLater />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
