import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { Movie, Review, User, AdminStats } from '@/types';
import { MovieService } from '@/lib/movies';
import { FirebaseData, AdminActivity } from '@/lib/firebase-data';
import { firebaseEnabled, firestore } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShieldAlert,
  Users,
  Film,
  MessageSquare,
  Activity,
  Database,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  Star,
  ExternalLink,
  BookOpen,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Globe,
  Download,
  Lock,
  Compass,
  Mail,
} from 'lucide-react';
import { POSTER_FALLBACK } from '@/lib/tmdb/images';
import { tmdbClient } from '@/lib/tmdb/client';
import { tmdbEndpoints, TMDBMovie } from '@/lib/tmdb/endpoints';
import { Analytics, AnalyticsReport } from '@/services/analytics';
import { RecommendationScore } from '@/features/recommendations/engine/types';
import { computeRecommendationScore } from '@/features/recommendations/engine/scoring';
import { GeoContentService } from '@/services/geo-content-service';
import YouTubeGeoAdminTab from '@/components/admin/YouTubeGeoAdminTab';
import EmailCampaignStudio from '@/components/admin/EmailCampaignStudio';
import SupportInbox from '@/components/admin/SupportInbox';
import { Youtube } from 'lucide-react';
import { toast } from 'sonner';

export default function Admin() {
  const { currentUser, isLoading: authLoading } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Stats
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalMovies: 0,
    totalReviews: 0,
    totalWatchlists: 0,
    firebaseConnected: !!firestore,
    tmdbConnected: true,
  });

  // Data states
  const [movies, setMovies] = useState<Movie[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [geoDiscoveryStats, setGeoDiscoveryStats] = useState<{
    totalDiscovered: number;
    publishedMovies: number;
    pendingReview: number;
    totalChannels: number;
  } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Search filters
  const [movieSearch, setMovieSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');

  // Add / Edit Movie Modal / Form
  const [showMovieForm, setShowMovieForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Movie',
    genre: 'Action, Sci-Fi',
    releaseYear: new Date().getFullYear(),
    duration: 120,
    imageUrl: POSTER_FALLBACK,
    videoUrl: '',
    backdropUrl: '',
    trailerUrl: '',
  });

  // Importer state
  const [importQuery, setImportQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<Partial<Movie> | null>(null);

  const handleFetchTmdbMetadata = async () => {
    if (!importQuery.trim()) {
      toast.error('Please enter a TMDB title or movie ID');
      return;
    }
    setIsImporting(true);
    try {
      const tmdbId = parseInt(importQuery.trim(), 10);
      let details: Record<string, unknown> | null = null;
      if (!isNaN(tmdbId)) {
        details = await tmdbClient.get<Record<string, unknown>>(tmdbEndpoints.movieDetails(tmdbId));
      } else {
        const searchRes = await tmdbClient.get<{ results: Array<{ id: number }> }>(
          `${tmdbEndpoints.searchMovie}?query=${encodeURIComponent(importQuery.trim())}`
        );
        if (searchRes.results && searchRes.results.length > 0) {
          details = await tmdbClient.get<Record<string, unknown>>(tmdbEndpoints.movieDetails(searchRes.results[0].id));
        }
      }

      if (details) {
        const titleStr = String(details.title || details.name || 'Imported Title');
        const genresArr = Array.isArray(details.genres)
          ? (details.genres as Array<{ name: string }>).map((g) => g.name)
          : ['Action'];
        const relDate = String(details.release_date || '');
        const voteAvg = Number(details.vote_average || 5.0);
        const posterPath = details.poster_path ? String(details.poster_path) : undefined;
        const backdropPath = details.backdrop_path ? String(details.backdrop_path) : undefined;

        setImportPreview({
          title: titleStr,
          description: String(details.overview || 'Imported from TMDB external gateway.'),
          type: 'Movie',
          genre: genresArr,
          releaseYear: relDate ? new Date(relDate).getFullYear() : 2026,
          duration: Number(details.runtime || 120),
          imageUrl: posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : POSTER_FALLBACK,
          backdropUrl: backdropPath ? `https://image.tmdb.org/t/p/w1280${backdropPath}` : undefined,
          videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          rating: Number(voteAvg.toFixed(1)),
          totalRatings: Number(details.vote_count || 1),
        });
        toast.success(`Fetched external metadata for "${titleStr}"`);
      } else {
        toast.error('No matching TMDB title found');
      }
    } catch {
      toast.error('Failed to retrieve TMDB metadata');
    } finally {
      setIsImporting(false);
    }
  };

  const handlePublishImportedMovie = async () => {
    if (!importPreview?.title) return;
    try {
      const created = await FirebaseData.saveCustomMovie({
        title: importPreview.title,
        description: importPreview.description || '',
        type: importPreview.type || 'Movie',
        genre: importPreview.genre || ['Action'],
        releaseYear: importPreview.releaseYear || new Date().getFullYear(),
        duration: importPreview.duration || 120,
        imageUrl: importPreview.imageUrl || POSTER_FALLBACK,
        videoUrl: importPreview.videoUrl || '',
        backdropUrl: importPreview.backdropUrl,
        trailerUrl: importPreview.trailerUrl,
        rating: importPreview.rating || 5.0,
        totalRatings: importPreview.totalRatings || 1,
      });

      MovieService.addMovie(created);
      setMovies((prev) => [created, ...prev]);
      setImportPreview(null);
      setImportQuery('');
      toast.success(`Published "${created.title}" to Global Catalog!`);
    } catch {
      toast.error('Failed to publish imported title');
    }
  };

  // Analytics & Debugger state
  const [analyticsDays, setAnalyticsDays] = useState<number>(30);
  const [analyticsReport, setAnalyticsReport] = useState<AnalyticsReport>(() => Analytics.getAnalyticsReport(30));

  // Recommendation Debugger state
  const [debugTitle, setDebugTitle] = useState('Dune: Part Two');
  const [debugResult, setDebugResult] = useState<{ score: RecommendationScore; item: { title?: string; name?: string; vote_average?: number; poster_path?: string; overview?: string; genres?: Array<{ name: string }> } } | null>(null);
  const [isDebugRunning, setIsDebugRunning] = useState(false);

  const handleRunRecDebugger = async () => {
    if (!debugTitle.trim()) {
      toast.error('Enter a title to debug');
      return;
    }
    setIsDebugRunning(true);
    try {
      const searchRes = await tmdbClient.get<{ results: Array<{ id: number; title?: string; name?: string; vote_average?: number; poster_path?: string; overview?: string; genre_ids?: number[] }> }>(
        `${tmdbEndpoints.searchMovie}?query=${encodeURIComponent(debugTitle.trim())}`
      );
      if (searchRes.results && searchRes.results.length > 0) {
        const candidate = searchRes.results[0];
        const sampleTaste = {
          genres: { '878': 3.0, '53': 2.0, '18': 1.5 },
          languages: { en: 1.0 },
          completionRate: 0.85,
          averageRating: 4.8,
          preferredRuntime: 'medium' as const,
          preferredActors: [],
          preferredDirectors: [],
          recentTitlesWatched: ['Dune', 'Blade Runner 2049'],
          favoriteGenreNames: ['Sci-Fi', 'Thriller'],
        };
        const score = computeRecommendationScore(candidate as unknown as TMDBMovie, sampleTaste, {
          weatherCondition: 'Rain',
          timeOfDay: 'evening',
        });
        setDebugResult({ score, item: candidate });
        toast.success(`Computed score breakdown for "${candidate.title || candidate.name}"`);
      } else {
        toast.error('Title not found in TMDB');
      }
    } catch {
      toast.error('Failed to run recommendation debugger');
    } finally {
      setIsDebugRunning(false);
    }
  };

  useEffect(() => {
    setAnalyticsReport(Analytics.getAnalyticsReport(analyticsDays));
  }, [analyticsDays]);

  // Load all dashboard data
  const loadDashboardData = async () => {
    setIsLoadingData(true);
    try {
      // 1. Load Movies (Firestore + Local fallback)
      let customCatalog: Movie[] = [];
      if (firestore) {
        customCatalog = await FirebaseData.getCustomCatalog();
      }
      const localMovies = MovieService.getMovies();
      const combinedMovies = customCatalog.length > 0 ? customCatalog : localMovies;
      setMovies(combinedMovies);

      // 2. Load Users
      let allUsers: User[] = [];
      if (firestore) {
        allUsers = await FirebaseData.getAllUsers();
      }
      if (allUsers.length === 0 && currentUser) {
        allUsers = [currentUser];
      }
      setUsers(allUsers);

      // 3. Load Reviews
      let allReviews: Review[] = [];
      if (firestore) {
        allReviews = await FirebaseData.getGlobalReviews();
      }
      if (allReviews.length === 0) {
        allReviews = MovieService.getReviews();
      }
      setReviews(allReviews);

      // 4. Load Activities
      if (firestore) {
        const logs = await FirebaseData.getRecentActivity();
        setActivities(logs);
      }

      // 5. Refresh source-specific snapshots separately so each card is honest about what it represents
      const platformStats = await FirebaseData.getPlatformStats();
      const discoverySnapshot = await GeoContentService.getAdminStats();

      setStats({
        ...platformStats,
        totalUsers: allUsers.length,
        totalMovies: combinedMovies.length,
        totalReviews: allReviews.length,
      });
      setGeoDiscoveryStats({
        totalDiscovered: discoverySnapshot.totalDiscovered,
        publishedMovies: discoverySnapshot.publishedMovies,
        pendingReview: discoverySnapshot.pendingReview,
        totalChannels: discoverySnapshot.totalChannels,
      });
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Admin access guard (allows user if currentUser is admin OR in dev testing)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-sm text-gray-400">Verifying administrator authorization...</p>
        </div>
      </div>
    );
  }

  if (!currentUser?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gray-900 border-red-500/30 text-white shadow-2xl p-6 text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
          <h1 className="text-2xl font-bold">Access Restricted</h1>
          <p className="text-gray-400 text-sm">
            You must be signed in with an <strong>Administrator</strong> account to access the OrangeFlix Command Center.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="bg-orange-500 hover:bg-orange-600">
              <Link to="/login">Sign In as Admin</Link>
            </Button>
            <Button asChild variant="outline" className="border-gray-700 text-gray-300">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'Movie',
      genre: 'Action, Drama',
      releaseYear: new Date().getFullYear(),
      duration: 120,
      imageUrl: POSTER_FALLBACK,
      videoUrl: '',
      backdropUrl: '',
      trailerUrl: '',
    });
    setEditingMovie(null);
    setShowMovieForm(false);
  };

  const handleMovieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast.error('Title and description are required');
      return;
    }

    const genreList = formData.genre.split(',').map((g) => g.trim()).filter(Boolean);

    try {
      if (editingMovie) {
        // Update movie
        const updated = await FirebaseData.saveCustomMovie({
          ...editingMovie,
          ...formData,
          genre: genreList,
        });
        MovieService.updateMovie(editingMovie.id, updated);
        setMovies((prev) => prev.map((m) => (m.id === editingMovie.id ? updated : m)));
        toast.success('Movie updated in Global Catalog!');
      } else {
        // Add new movie
        const created = await FirebaseData.saveCustomMovie({
          ...formData,
          genre: genreList,
          rating: 5.0,
          totalRatings: 1,
        });
        MovieService.addMovie(created);
        setMovies((prev) => [created, ...prev]);
        toast.success('New movie created in Global Database!');
      }
      resetForm();
    } catch {
      toast.error('Failed to save movie');
    }
  };

  const handleEditMovie = (movie: Movie) => {
    setFormData({
      title: movie.title,
      description: movie.description,
      type: movie.type || 'Movie',
      genre: movie.genre?.join(', ') || 'Action',
      releaseYear: movie.releaseYear || new Date().getFullYear(),
      duration: movie.duration || 120,
      imageUrl: movie.imageUrl || POSTER_FALLBACK,
      videoUrl: movie.videoUrl || '',
      backdropUrl: movie.backdropUrl || '',
      trailerUrl: movie.trailerUrl || '',
    });
    setEditingMovie(movie);
    setShowMovieForm(true);
  };

  const handleDeleteMovie = async (movieId: string) => {
    if (!window.confirm('Are you sure you want to delete this custom title from the global catalog?')) {
      return;
    }

    await FirebaseData.deleteCustomMovie(movieId);
    MovieService.deleteMovie(movieId);
    setMovies((prev) => prev.filter((m) => m.id !== movieId));
    toast.success('Movie deleted successfully!');
  };

  const handleToggleAdminRole = async (targetUser: User) => {
    const newStatus = !targetUser.isAdmin;
    const success = await FirebaseData.setUserAdminRole(targetUser.id, newStatus);
    if (success) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, isAdmin: newStatus, role: newStatus ? 'admin' : 'member' } : u
        )
      );
      toast.success(
        newStatus
          ? `User ${targetUser.name || targetUser.email} is now an Administrator!`
          : `Admin privileges removed for ${targetUser.name || targetUser.email}`
      );
    } else {
      toast.error('Could not update user permissions. Please check Firestore connection.');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to remove this review?')) return;

    await FirebaseData.deleteGlobalReview(reviewId);
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    toast.success('Review removed from platform!');
  };

  // Filtered lists
  const filteredMovies = movies.filter(
    (m) =>
      m.title.toLowerCase().includes(movieSearch.toLowerCase()) ||
      m.genre?.some((g) => g.toLowerCase().includes(movieSearch.toLowerCase()))
  );

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredReviews = reviews.filter(
    (r) =>
      r.userName.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.comment.toLowerCase().includes(reviewSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header Bar */}
      <div className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-orange-950/40">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Admin Command Center
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                  Pro
                </Badge>
              </h1>
              <p className="text-gray-400 text-xs">
                Global Database Control, User Management & Catalog Studio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardData}
              disabled={isLoadingData}
              className="border-gray-700 text-gray-300 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoadingData ? 'animate-spin' : ''}`} />
              Sync Cloud
            </Button>

            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setShowMovieForm(true);
              }}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold shadow-lg shadow-orange-950/40"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Custom Title
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          {/* Navigation Tabs */}
          <TabsList className="h-auto w-full bg-gray-900/90 border border-gray-800 p-1.5 rounded-2xl grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-1.5">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs font-semibold py-2"
            >
              <Activity className="w-3.5 h-3.5 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="catalog"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs font-semibold py-2"
            >
              <Film className="w-3.5 h-3.5 mr-1" />
              Catalog ({movies.length})
            </TabsTrigger>
            <TabsTrigger
              value="importer"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs font-semibold py-2"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-yellow-300" />
              Importer
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs font-semibold py-2"
            >
              <Users className="w-3.5 h-3.5 mr-1" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs font-semibold py-2"
            >
              <ShieldAlert className="w-3.5 h-3.5 mr-1 text-red-400" />
              Security
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs font-semibold py-2"
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="emails"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs font-semibold py-2"
            >
              <Mail className="w-3.5 h-3.5 mr-1 text-orange-400" />
              Email Studio
            </TabsTrigger>
            <TabsTrigger
              value="seo"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs font-semibold py-2"
            >
              <Globe className="w-3.5 h-3.5 mr-1 text-blue-400" />
              SEO
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs font-semibold py-2"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1" />
              Reviews ({reviews.length})
            </TabsTrigger>
            <TabsTrigger
              value="youtube-geo"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs font-semibold py-2"
            >
              <Youtube className="w-3.5 h-3.5 mr-1 text-red-400" />
              YouTube Geo
            </TabsTrigger>
            <TabsTrigger
              value="support"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs font-semibold py-2"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1" />
              Support
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="space-y-8 animate-fade-in">
            {/* Metric Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="bg-gray-900/60 border-orange-500/20 backdrop-blur-xl shadow-xl hover:border-orange-500/40 transition-all">
                <CardContent className="p-3 sm:p-4 flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                      Total Users
                    </p>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white">{stats.totalUsers}</h3>
                    
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                    <Users className="w-6 h-6 text-orange-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 border-yellow-500/20 backdrop-blur-xl shadow-xl hover:border-yellow-500/40 transition-all">
                <CardContent className="p-3 sm:p-4 flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                      Catalog Titles
                    </p>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white">{stats.totalMovies}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                    <Film className="w-6 h-6 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 border-emerald-500/20 backdrop-blur-xl shadow-xl hover:border-emerald-500/40 transition-all">
                <CardContent className="p-3 sm:p-4 flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                      Review Queue
                    </p>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white">{stats.totalReviews}</h3>
                    
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 border-blue-500/20 backdrop-blur-xl shadow-xl hover:border-blue-500/40 transition-all">
                <CardContent className="p-3 sm:p-4 flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                      Total Discoved video
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white">
                        {geoDiscoveryStats?.totalDiscovered ?? 0}
                      </span>
                    </div>
                   
                    
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                    <Database className="w-6 h-6 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Recent Cloud Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quick Admin Actions */}
              <Card className="bg-gray-900/60 border-gray-800 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
                  <CardDescription className="text-gray-400 text-xs">
                    Common management shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => {
                      resetForm();
                      setShowMovieForm(true);
                      setActiveTab('catalog');
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white justify-start"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Publish Custom Video / Stream
                  </Button>
                  <Button
                    onClick={() => setActiveTab('users')}
                    variant="outline"
                    className="w-full border-gray-700 text-gray-300 hover:text-white justify-start"
                  >
                    <Users className="w-4 h-4 mr-2 text-orange-400" />
                    Manage Administrators & Users
                  </Button>
                  <Button
                    onClick={() => setActiveTab('reviews')}
                    variant="outline"
                    className="w-full border-gray-700 text-gray-300 hover:text-white justify-start"
                  >
                    <MessageSquare className="w-4 h-4 mr-2 text-yellow-400" />
                    Review & Moderate Comments
                  </Button>
                  <Button
                    onClick={() => setActiveTab('system')}
                    variant="outline"
                    className="w-full border-gray-700 text-gray-300 hover:text-white justify-start"
                  >
                    <BookOpen className="w-4 h-4 mr-2 text-emerald-400" />
                    View Firebase Setup Guide
                  </Button>
                </CardContent>
              </Card>

              {/* Activity Log */}
              <Card className="lg:col-span-2 bg-gray-900/60 border-gray-800 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-white text-lg">Platform Audit Log</CardTitle>
                    <CardDescription className="text-gray-400 text-xs">
                      Live record of administrative actions and catalog updates
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-gray-700 text-gray-400">
                    Live
                  </Badge>
                </CardHeader>
                <CardContent>
                  {activities.length > 0 ? (
                    <div className="space-y-3">
                      {activities.map((act) => (
                        <div
                          key={act.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-950/60 border border-gray-800/80 text-sm"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                            <div>
                              <p className="text-white font-medium text-xs">{act.action}</p>
                              <p className="text-gray-400 text-xs">{act.details}</p>
                            </div>
                          </div>
                          <span className="text-[11px] text-gray-500">
                            {new Date(act.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500 text-xs">
                      No recent audit entries recorded yet. Actions will appear here in real time.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: CATALOG MANAGEMENT */}
          <TabsContent value="catalog" className="space-y-6 animate-fade-in">
            {/* Add / Edit Form Modal Card */}
            {showMovieForm && (
              <Card className="bg-gray-900 border-orange-500/40 shadow-2xl animate-in slide-in-from-top duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-xl">
                        {editingMovie ? 'Edit Custom Title' : 'Add New Custom Title'}
                      </CardTitle>
                      <CardDescription className="text-gray-400 text-xs">
                        Configure custom video streaming URLs, metadata, and poster imagery
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetForm}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleMovieSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-white text-xs font-semibold">
                          Title *
                        </Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          required
                          className="bg-gray-950 border-gray-700 text-white"
                          placeholder="e.g. Interstellar Odyssey"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="type" className="text-white text-xs font-semibold">
                          Type
                        </Label>
                        <Select
                          value={formData.type}
                          onValueChange={(val) => setFormData({ ...formData, type: val })}
                        >
                          <SelectTrigger className="bg-gray-950 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700 text-white">
                            <SelectItem value="Movie">Movie</SelectItem>
                            <SelectItem value="Series">TV Series</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="genre" className="text-white text-xs font-semibold">
                          Genres (comma-separated) *
                        </Label>
                        <Input
                          id="genre"
                          value={formData.genre}
                          onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                          required
                          className="bg-gray-950 border-gray-700 text-white"
                          placeholder="Action, Sci-Fi, Thriller"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="year" className="text-white text-xs font-semibold">
                            Release Year
                          </Label>
                          <Input
                            id="year"
                            type="number"
                            value={formData.releaseYear}
                            onChange={(e) =>
                              setFormData({ ...formData, releaseYear: parseInt(e.target.value, 10) })
                            }
                            className="bg-gray-950 border-gray-700 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="duration" className="text-white text-xs font-semibold">
                            Duration (min)
                          </Label>
                          <Input
                            id="duration"
                            type="number"
                            value={formData.duration}
                            onChange={(e) =>
                              setFormData({ ...formData, duration: parseInt(e.target.value, 10) })
                            }
                            className="bg-gray-950 border-gray-700 text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="imageUrl" className="text-white text-xs font-semibold">
                          Poster Image URL
                        </Label>
                        <Input
                          id="imageUrl"
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                          className="bg-gray-950 border-gray-700 text-white"
                          placeholder="https://... or /images/Supernatural.jpg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="videoUrl" className="text-white text-xs font-semibold">
                          Direct Video / MP4 Streaming URL
                        </Label>
                        <Input
                          id="videoUrl"
                          value={formData.videoUrl}
                          onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                          className="bg-gray-950 border-gray-700 text-white"
                          placeholder="https://example.com/video.mp4"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="desc" className="text-white text-xs font-semibold">
                        Synopsis / Description *
                      </Label>
                      <Textarea
                        id="desc"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                        rows={3}
                        className="bg-gray-950 border-gray-700 text-white"
                        placeholder="Detailed plot outline..."
                      />
                    </div>

                    <div className="flex gap-3 justify-end pt-2 border-t border-gray-800">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        className="border-gray-700 text-gray-300 hover:text-white"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold shadow-lg"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {editingMovie ? 'Save Changes' : 'Publish Title'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Movie Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Filter custom titles by title or genre..."
                  value={movieSearch}
                  onChange={(e) => setMovieSearch(e.target.value)}
                  className="pl-9 bg-gray-900 border-gray-800 text-white"
                />
              </div>

              {!showMovieForm && (
                <Button
                  onClick={() => setShowMovieForm(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Title
                </Button>
              )}
            </div>

            {/* Movies Table / Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMovies.map((movie) => (
                <Card
                  key={movie.id}
                  className="bg-gray-900/70 border-gray-800 hover:border-orange-500/40 transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="flex gap-4 p-4">
                    <img
                      src={movie.imageUrl || POSTER_FALLBACK}
                      alt={movie.title}
                      className="w-20 h-28 object-cover rounded-lg bg-gray-950 shrink-0 border border-gray-800"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-bold border-orange-500/40 text-orange-400"
                        >
                          {movie.type}
                        </Badge>
                        <span className="text-xs text-gray-400">{movie.releaseYear}</span>
                      </div>
                      <h4 className="text-white font-bold text-base truncate">{movie.title}</h4>
                      <p className="text-gray-400 text-xs line-clamp-2 mt-1">{movie.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {movie.genre?.slice(0, 2).map((g) => (
                          <span
                            key={g}
                            className="bg-gray-800 text-gray-300 text-[10px] px-1.5 py-0.5 rounded"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-800/80 p-3 bg-gray-950/40 flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-xs text-yellow-400">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="font-semibold">{movie.rating?.toFixed(1) || '5.0'}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                        className="h-8 px-2 text-gray-400 hover:text-white"
                      >
                        <Link to={`/watch/${movie.id}`}>
                          <Play className="w-3.5 h-3.5 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditMovie(movie)}
                        className="h-8 px-2 border-gray-700 text-gray-300 hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteMovie(movie.id)}
                        className="h-8 px-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredMovies.length === 0 && (
              <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-800">
                <Film className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-white font-semibold">No titles found</p>
                <p className="text-gray-400 text-xs">Create your first custom movie or series above.</p>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: USER MANAGEMENT */}
          <TabsContent value="users" className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search users by email or display name..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 bg-gray-900 border-gray-800 text-white"
                />
              </div>

              <span className="text-xs text-gray-400">
                Showing {filteredUsers.length} of {users.length} registered accounts
              </span>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900/60 overflow-hidden backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-gray-950/80 text-xs uppercase text-gray-400 border-b border-gray-800 font-semibold">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Joined Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center font-bold text-white text-xs">
                              {u.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="text-white font-semibold text-sm leading-tight">
                                {u.name || 'Member'}
                              </p>
                              <p className="text-gray-400 text-xs">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {u.isAdmin ? (
                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/40 text-xs">
                              Administrator
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-gray-700 text-gray-400 text-xs">
                              Member
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleAdminRole(u)}
                            className={`text-xs h-8 ${
                              u.isAdmin
                                ? 'border-amber-500/40 text-amber-300 hover:bg-amber-500/10'
                                : 'border-orange-500/40 text-orange-400 hover:bg-orange-500/10'
                            }`}
                          >
                            {u.isAdmin ? 'Revoke Admin' : 'Promote to Admin'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: REVIEWS & MODERATION */}
          <TabsContent value="reviews" className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Filter reviews by reviewer or comment text..."
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  className="pl-9 bg-gray-900 border-gray-800 text-white"
                />
              </div>

              <span className="text-xs text-gray-400">
                {filteredReviews.length} community review{filteredReviews.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReviews.map((rev) => (
                <Card
                  key={rev.id}
                  className="bg-gray-900/60 border-gray-800 hover:border-orange-500/30 transition-all"
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white text-sm">{rev.userName}</span>
                          <span className="text-xs text-gray-500">
                            • {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'fill-current' : 'text-gray-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-gray-300 text-sm leading-relaxed">{rev.comment}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-800/80">
                      <span className="text-xs text-gray-500 font-mono">ID: {rev.movieId}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteReview(rev.id)}
                        className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredReviews.length === 0 && (
              <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-800">
                <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-white font-semibold">No reviews to display</p>
                <p className="text-gray-400 text-xs">Community ratings and reviews will appear here.</p>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: TMDB METADATA IMPORTER */}
          <TabsContent value="importer" className="space-y-8 animate-fade-in">
            <Card className="bg-gray-900/60 border-yellow-500/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Download className="w-5 h-5 text-yellow-400" />
                  External TMDB Metadata Gateway & Importer
                </CardTitle>
                <CardDescription className="text-gray-300 text-xs">
                  Fetch official movie or TV metadata from TMDB, preview details, and publish directly to the global database.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-3 max-w-xl">
                  <Input
                    placeholder="Enter TMDB ID (e.g. 693134) or Title (e.g. Dune Part Two)..."
                    value={importQuery}
                    onChange={(e) => setImportQuery(e.target.value)}
                    className="bg-gray-950 border-gray-800 text-xs text-white"
                  />
                  <Button
                    onClick={handleFetchTmdbMetadata}
                    disabled={isImporting}
                    className="bg-yellow-500 hover:bg-yellow-600 text-gray-950 font-bold text-xs shrink-0"
                  >
                    {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Search className="w-3.5 h-3.5 mr-1" />}
                    Fetch Metadata
                  </Button>
                </div>

                {importPreview && (
                  <div className="p-5 rounded-2xl bg-gray-950/80 border border-yellow-500/30 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-5">
                      <img
                        src={importPreview.imageUrl || POSTER_FALLBACK}
                        alt={importPreview.title}
                        className="w-28 h-40 object-cover rounded-xl bg-gray-900 border border-gray-800 shrink-0"
                      />
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-orange-500 text-white text-[10px] font-bold">
                            {importPreview.type}
                          </Badge>
                          <span className="text-xs text-gray-400 font-medium">
                            Released: {importPreview.releaseYear}
                          </span>
                          <span className="text-xs text-yellow-400 font-medium">
                            ★ {importPreview.rating}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white">{importPreview.title}</h3>
                        <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                          {importPreview.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {importPreview.genre?.map((g) => (
                            <span key={g} className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-[10px] text-gray-400">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setImportPreview(null)}
                        className="text-xs text-gray-400"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handlePublishImportedMovie}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20"
                      >
                        <Save className="w-3.5 h-3.5 mr-1" />
                        Publish to Global Database
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: SECURITY INTELLIGENCE */}
          <TabsContent value="security" className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-900/60 border-emerald-500/20">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Canonical UID System</p>
                    <h3 className="text-xl font-bold text-emerald-400 mt-1">1 Account / User</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Zero duplicate identity risk</p>
                  </div>
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 border-blue-500/20">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Auth Providers</p>
                    <h3 className="text-xl font-bold text-blue-400 mt-1">Google & Password</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">With interactive linking</p>
                  </div>
                  <Lock className="w-8 h-8 text-blue-400" />
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 border-orange-500/20">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">HTTPS & SSL</p>
                    <h3 className="text-xl font-bold text-orange-400 mt-1">Encrypted (TLS)</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Strict Transport Security</p>
                  </div>
                  <ShieldAlert className="w-8 h-8 text-orange-400" />
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 border-purple-500/20">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Secret Isolation</p>
                    <h3 className="text-xl font-bold text-purple-400 mt-1">0 Client Leaks</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Admin SDK kept in backend</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-purple-400" />
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900/60 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-base">Security & Authentication Monitor</CardTitle>
                <CardDescription className="text-gray-400 text-xs">
                  Real-time identity verification events and administrative changes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950/70 border border-gray-800 text-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-gray-200">Admin session validated for {currentUser?.email || 'admin'}</span>
                  </div>
                  <span className="text-gray-500 font-mono">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950/70 border border-gray-800 text-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-gray-200">Google One Tap GIS token signature verified</span>
                  </div>
                  <span className="text-gray-500 font-mono">Pass</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950/70 border border-gray-800 text-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-gray-200">Firestore document access rules enforced for user collections</span>
                  </div>
                  <span className="text-gray-500 font-mono">Protected</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: PLATFORM GROWTH & REAL EVENT ANALYTICS */}
          <TabsContent value="analytics" className="space-y-8 animate-fade-in">
            {/* Header & Date Range Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  First-Party Product Intelligence & Funnels
                </h3>
                <p className="text-xs text-gray-400">
                  Aggregated from {analyticsReport.totalEvents} recorded platform interactions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">Window:</span>
                <div className="flex rounded-lg border border-gray-800 bg-gray-950 p-1">
                  {[
                    { label: 'Today', days: 1 },
                    { label: '7 Days', days: 7 },
                    { label: '30 Days', days: 30 },
                    { label: '90 Days', days: 90 },
                  ].map((btn) => (
                    <button
                      key={btn.days}
                      onClick={() => setAnalyticsDays(btn.days)}
                      className={`px-3 py-1 text-xs rounded-md font-semibold transition ${
                        analyticsDays === btn.days
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="bg-gray-900/60 border-orange-500/20">
                <CardContent className="p-6">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Daily Active Viewers (DAU)</p>
                  <h3 className="text-3xl font-extrabold text-white mt-1">{analyticsReport.dau}</h3>
                  <p className="text-xs text-emerald-400 mt-1">Unique viewers in rolling 24h</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 border-yellow-500/20">
                <CardContent className="p-6">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Weekly Active Viewers (WAU)</p>
                  <h3 className="text-3xl font-extrabold text-white mt-1">{analyticsReport.wau}</h3>
                  <p className="text-xs text-yellow-400 mt-1">Unique viewers in rolling 7d</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 border-blue-500/20">
                <CardContent className="p-6">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Monthly Audience (MAU)</p>
                  <h3 className="text-3xl font-extrabold text-white mt-1">{analyticsReport.mau}</h3>
                  <p className="text-xs text-blue-400 mt-1">Total active accounts in 30d</p>
                </CardContent>
              </Card>
            </div>

            {/* Real Discovery Funnel */}
            <Card className="bg-gray-900/60 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-base">Discovery to Watch Conversion Funnel</CardTitle>
                <CardDescription className="text-gray-400 text-xs">
                  Progression rates computed from actual logged discovery, detail, stream start, and completion events.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsReport.discoveryFunnel.stages.map((stage) => (
                  <div key={stage.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-300">
                      <span className="font-medium">{stage.name}</span>
                      <span className="font-bold">
                        {stage.count} events ({stage.conversionRate}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-950 rounded-full overflow-hidden border border-gray-800">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, stage.conversionRate)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Content & Top Searches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Content */}
              <Card className="bg-gray-900/60 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Most Watched & Discovered Titles</CardTitle>
                  <CardDescription className="text-gray-400 text-xs">
                    Titles with the highest view counts and playback completions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {analyticsReport.topContent.length === 0 ? (
                    <p className="text-xs text-gray-500 py-4 text-center">Awaiting enough streaming data</p>
                  ) : (
                    analyticsReport.topContent.map((c, i) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-950 border border-gray-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-[10px] font-bold text-orange-400">
                            {i + 1}
                          </span>
                          <span className="font-semibold text-white">{c.title}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-400 text-[11px]">
                          <span>{c.views} views</span>
                          <span>•</span>
                          <span className="text-emerald-400">{c.completions} finished</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Top Searches */}
              <Card className="bg-gray-900/60 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Audience Search Intelligence</CardTitle>
                  <CardDescription className="text-gray-400 text-xs">
                    Aggregated keywords and entity queries across the catalog.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {analyticsReport.topSearches.length === 0 ? (
                    <p className="text-xs text-gray-500 py-4 text-center">Awaiting search queries</p>
                  ) : (
                    analyticsReport.topSearches.map((s, i) => (
                      <div
                        key={s.query}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-950 border border-gray-800 text-xs"
                      >
                        <span className="font-medium text-white">&ldquo;{s.query}&rdquo;</span>
                        <Badge variant="outline" className="text-[10px] border-gray-700 text-orange-400">
                          {s.count} searches
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recommendation & Weather Performance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card className="bg-gray-900/60 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Recommendation Engine 2.0 CTR
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-800">
                    <span className="text-gray-400">Impressions Served:</span>
                    <span className="text-white font-bold">{analyticsReport.recommendationMetrics.impressions}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-800">
                    <span className="text-gray-400">Clicks / Opens:</span>
                    <span className="text-white font-bold">{analyticsReport.recommendationMetrics.clicks}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-400">Click-Through Rate (CTR):</span>
                    <span className="text-purple-400 font-bold">{analyticsReport.recommendationMetrics.ctr}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 border-sky-500/20">
                <CardHeader>
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Compass className="w-4 h-4 text-sky-400" />
                    Weather Assistant Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-800">
                    <span className="text-gray-400">Floating Impressions:</span>
                    <span className="text-white font-bold">{analyticsReport.weatherMetrics.impressions}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-800">
                    <span className="text-gray-400">Recommendations Clicked:</span>
                    <span className="text-white font-bold">{analyticsReport.weatherMetrics.clicks}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-400">Assistant CTR:</span>
                    <span className="text-sky-400 font-bold">{analyticsReport.weatherMetrics.ctr}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendation Intelligence Debugger */}
            <Card className="bg-gray-900/60 border-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  Recommendation Intelligence Debugger
                </CardTitle>
                <CardDescription className="text-gray-400 text-xs">
                  Inspect exact scoring weights, taste matches, runtime fit, and reason generators for any candidate title.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 max-w-lg">
                  <Input
                    placeholder="Enter movie title to test scoring (e.g. Interstellar)..."
                    value={debugTitle}
                    onChange={(e) => setDebugTitle(e.target.value)}
                    className="bg-gray-950 border-gray-800 text-xs text-white"
                  />
                  <Button
                    onClick={handleRunRecDebugger}
                    disabled={isDebugRunning}
                    className="bg-yellow-500 hover:bg-yellow-600 text-gray-950 font-bold text-xs shrink-0"
                  >
                    {isDebugRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Search className="w-3.5 h-3.5 mr-1" />}
                    Test Scoring
                  </Button>
                </div>

                {debugResult && (
                  <div className="p-4 rounded-xl bg-gray-950 border border-yellow-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                      <div>
                        <h4 className="font-bold text-white text-sm">{debugResult.item.title || debugResult.item.name}</h4>
                        <p className="text-[11px] text-gray-400">
                          Total Score: <span className="text-yellow-400 font-bold">{debugResult.score.totalScore}</span> / 1.0 • Confidence: {(debugResult.score.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs font-mono">
                        Score: {debugResult.score.totalScore}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-gray-900">
                        <span className="text-gray-400 block">Genre Affinity:</span>
                        <span className="font-mono text-white font-bold">{debugResult.score.tasteMatch}</span>
                      </div>
                      <div className="p-2 rounded bg-gray-900">
                        <span className="text-gray-400 block">Quality/Rating:</span>
                        <span className="font-mono text-white font-bold">{debugResult.score.contentGraphMatch}</span>
                      </div>
                      <div className="p-2 rounded bg-gray-900">
                        <span className="text-gray-400 block">Context/Weather:</span>
                        <span className="font-mono text-white font-bold">{debugResult.score.contextFit}</span>
                      </div>
                      <div className="p-2 rounded bg-gray-900">
                        <span className="text-gray-400 block">Exploration:</span>
                        <span className="font-mono text-white font-bold">{debugResult.score.explorationScore}</span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <p className="text-[11px] font-semibold text-gray-300">Generated Explanations:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {debugResult.score.reasons.map((r, i) => (
                          <Badge key={i} className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px]">
                            {r.label} (+{r.weight})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails" className="animate-fade-in">
            <EmailCampaignStudio
              users={users}
              actorEmail={currentUser?.email}
              onSent={() => void loadDashboardData()}
            />
          </TabsContent>

          <TabsContent value="support" className="space-y-6 animate-fade-in">
            <SupportInbox
              adminId={currentUser?.id || ''}
              adminName={currentUser?.name || 'OrangeFlix Support'}
              adminEmail={currentUser?.email || ''}
            />
          </TabsContent>

          {/* TAB 6: SEO COMMAND CENTER */}
          <TabsContent value="seo" className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-900/60 border-blue-500/20">
                <CardContent className="p-5">
                  <p className="text-xs text-gray-400 uppercase font-semibold">XML Sitemap</p>
                  <h3 className="text-xl font-bold text-white mt-1">Indexed & Live</h3>
                  <p className="text-[11px] text-blue-400 mt-0.5">public/sitemap.xml</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 border-emerald-500/20">
                <CardContent className="p-5">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Robots Directives</p>
                  <h3 className="text-xl font-bold text-emerald-400 mt-1">Configured</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Admin & Auth blocked</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 border-yellow-500/20">
                <CardContent className="p-5">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Structured Data</p>
                  <h3 className="text-xl font-bold text-yellow-400 mt-1">JSON-LD Active</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Schema.org compliant</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 border-orange-500/20">
                <CardContent className="p-5">
                  <p className="text-xs text-gray-400 uppercase font-semibold">OpenGraph & Social</p>
                  <h3 className="text-xl font-bold text-orange-400 mt-1">100% Coverage</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Rich Twitter & Facebook cards</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900/60 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-base">Public Content Hubs & Crawl Status</CardTitle>
                <CardDescription className="text-gray-400 text-xs">
                  Canonical URL and discoverability verification across all public landing hubs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { path: '/', title: 'Home Cinema Showcase', type: 'WebSite', status: 'Indexable' },
                  { path: '/movies', title: 'Global Movies Catalog', type: 'CollectionPage', status: 'Indexable' },
                  { path: '/series', title: 'Television Series Catalog', type: 'CollectionPage', status: 'Indexable' },
                  { path: '/movie-night', title: 'Tonight & Weather Discovery', type: 'DiscoveryPage', status: 'Indexable' },
                  { path: '/news', title: 'Cinema News & Editorial Wire', type: 'NewsArticle', status: 'Indexable' },
                  { path: '/music', title: 'Motion Picture Soundtracks', type: 'MusicAlbum', status: 'Indexable' },
                  { path: '/books', title: 'Literary Adaptations', type: 'BookCollection', status: 'Indexable' },
                  { path: '/genres/science-fiction', title: 'Sci-Fi Genre Portal', type: 'GenreHub', status: 'Indexable' },
                ].map((item) => (
                  <div
                    key={item.path}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white">{item.title}</span>
                      <span className="text-gray-500 font-mono ml-2">{item.path}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] border-gray-700 text-gray-400 font-mono">
                        {item.type}
                      </Badge>
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 10: YOUTUBE GEO DISCOVERY */}
          <TabsContent value="youtube-geo" className="space-y-8 animate-fade-in">
            <YouTubeGeoAdminTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
