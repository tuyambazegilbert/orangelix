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
} from 'lucide-react';
import { toast } from 'sonner';

export default function Admin() {
  const { currentUser } = useAuth();

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
    imageUrl: '/images/ImageUpload.jpg',
    videoUrl: '',
    backdropUrl: '',
    trailerUrl: '',
  });

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

      // 5. Update Stats
      const platformStats = await FirebaseData.getPlatformStats();
      setStats({
        ...platformStats,
        totalUsers: allUsers.length,
        totalMovies: combinedMovies.length,
        totalReviews: allReviews.length,
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
      imageUrl: '/images/ImageUpload.jpg',
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
      imageUrl: movie.imageUrl || '/images/ImageUpload.jpg',
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Navigation Tabs */}
          <TabsList className="bg-gray-900 border border-gray-800 p-1 rounded-xl grid grid-cols-2 md:grid-cols-5 gap-1">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs font-semibold py-2.5"
            >
              <Activity className="w-4 h-4 mr-1.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="catalog"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs font-semibold py-2.5"
            >
              <Film className="w-4 h-4 mr-1.5" />
              Catalog ({movies.length})
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs font-semibold py-2.5"
            >
              <Users className="w-4 h-4 mr-1.5" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs font-semibold py-2.5"
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />
              Reviews ({reviews.length})
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs font-semibold py-2.5 col-span-2 md:col-span-1"
            >
              <Database className="w-4 h-4 mr-1.5" />
              Cloud & Setup
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="space-y-8 animate-fade-in">
            {/* Metric Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-900/60 border-orange-500/20 backdrop-blur-xl shadow-xl hover:border-orange-500/40 transition-all">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                      Global Users
                    </p>
                    <h3 className="text-3xl font-extrabold text-white">{stats.totalUsers}</h3>
                    <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Registered accounts
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                    <Users className="w-6 h-6 text-orange-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 border-yellow-500/20 backdrop-blur-xl shadow-xl hover:border-yellow-500/40 transition-all">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                      Custom Titles
                    </p>
                    <h3 className="text-3xl font-extrabold text-white">{stats.totalMovies}</h3>
                    <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                      <Film className="w-3 h-3" /> Direct stream titles
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                    <Film className="w-6 h-6 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 border-emerald-500/20 backdrop-blur-xl shadow-xl hover:border-emerald-500/40 transition-all">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                      Audience Reviews
                    </p>
                    <h3 className="text-3xl font-extrabold text-white">{stats.totalReviews}</h3>
                    <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                      <Star className="w-3 h-3" /> Community ratings
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 border-blue-500/20 backdrop-blur-xl shadow-xl hover:border-blue-500/40 transition-all">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                      Database Sync
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white">
                        {firebaseEnabled ? 'Firestore Cloud' : 'Local Standby'}
                      </span>
                    </div>
                    <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                      {firebaseEnabled ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      {firebaseEnabled ? 'Connected globally' : 'Awaiting .env keys'}
                    </p>
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
                      src={movie.imageUrl || '/images/ImageUpload.jpg'}
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

          {/* TAB 5: SYSTEM & CLOUD SETUP */}
          <TabsContent value="system" className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Connection Status Card */}
              <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Firebase Cloud Status</CardTitle>
                  <CardDescription className="text-gray-400 text-xs">
                    Current connection to Cloud Firestore & Auth
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-950 border border-gray-800">
                    <span className="text-sm text-gray-300">Firestore Cloud</span>
                    <Badge
                      className={
                        firebaseEnabled
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }
                    >
                      {firebaseEnabled ? 'Active' : 'Unconfigured'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-950 border border-gray-800">
                    <span className="text-sm text-gray-300">TMDB API Gateway</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      Connected
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-950 border border-gray-800">
                    <span className="text-sm text-gray-300">Authentication Service</span>
                    <Badge
                      className={
                        firebaseEnabled
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      }
                    >
                      {firebaseEnabled ? 'Firebase Auth' : 'Local Auth'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Guide Card */}
              <Card className="lg:col-span-2 bg-gradient-to-r from-orange-950/20 via-gray-900 to-yellow-950/20 border-orange-500/30 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-orange-400" />
                    Complete Firebase Setup Documentation
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-xs">
                    Follow the full guide in <code>FIREBASE_SETUP_GUIDE.md</code> to link your live Firestore project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    To make all OrangeFlix data permanently stored globally across devices:
                  </p>

                  <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-2">
                    <li>Create a project in the <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline">Firebase Console</a>.</li>
                    <li>Enable <strong>Authentication</strong> (Email/Password + Google Provider).</li>
                    <li>Create a <strong>Cloud Firestore Database</strong>.</li>
                    <li>Copy the configuration keys to your <code>.env</code> file.</li>
                    <li>Deploy the provided security rules from <code>firestore.rules</code>.</li>
                  </ol>

                  <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800 text-xs space-y-2">
                    <p className="text-orange-400 font-semibold">Environment Keys Checklist:</p>
                    <code className="block text-gray-400 font-mono text-[11px] space-y-1">
                      VITE_FIREBASE_API_KEY=...<br />
                      VITE_FIREBASE_AUTH_DOMAIN=...<br />
                      VITE_FIREBASE_PROJECT_ID=...<br />
                      VITE_FIREBASE_STORAGE_BUCKET=...<br />
                      VITE_FIREBASE_MESSAGING_SENDER_ID=...<br />
                      VITE_FIREBASE_APP_ID=...
                    </code>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}