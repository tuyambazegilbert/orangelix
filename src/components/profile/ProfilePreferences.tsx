import { useState } from 'react';
import { User, UserPreferences } from '@/types';
import { FirebaseData } from '@/lib/firebase-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Sliders,
  Tv,
  Palette,
  Globe,
  Bell,
  Lock,
  Save,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

interface ProfilePreferencesProps {
  currentUser: User;
  onPreferencesUpdated: (prefs: UserPreferences) => void;
}

const AVAILABLE_GENRES = [
  'Action',
  'Sci-Fi',
  'Drama',
  'Comedy',
  'Thriller',
  'Horror',
  'Fantasy',
  'Adventure',
  'Animation',
  'Crime',
  'Romance',
  'Documentary',
];

export default function ProfilePreferences({
  currentUser,
  onPreferencesUpdated,
}: ProfilePreferencesProps) {
  const { theme, setTheme } = useTheme();

  const [prefs, setPrefs] = useState<UserPreferences>({
    theme: (theme as 'dark' | 'light' | 'system') || 'dark',
    language: currentUser.preferences?.language || 'English (US)',
    favoriteGenres: currentUser.preferences?.favoriteGenres || ['Action', 'Sci-Fi', 'Drama'],
    autoplayNext: currentUser.preferences?.autoplayNext ?? true,
    autoplayPreviews: currentUser.preferences?.autoplayPreviews ?? true,
    defaultQuality: currentUser.preferences?.defaultQuality || 'auto',
    subtitles: currentUser.preferences?.subtitles || 'off',
    skipIntro: currentUser.preferences?.skipIntro ?? true,
    continueWatching: currentUser.preferences?.continueWatching ?? true,
    notifications: {
      newReleases: currentUser.preferences?.notifications?.newReleases ?? true,
      recommendations: currentUser.preferences?.notifications?.recommendations ?? true,
      securityAlerts: currentUser.preferences?.notifications?.securityAlerts ?? true,
    },
    privacy: {
      profileVisibility: currentUser.preferences?.privacy?.profileVisibility || 'public',
      historyVisibility: currentUser.preferences?.privacy?.historyVisibility || 'private',
      personalizedAds: currentUser.preferences?.privacy?.personalizedAds ?? true,
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  const toggleGenre = (genre: string) => {
    setPrefs((prev) => {
      const exists = prev.favoriteGenres.includes(genre);
      const updated = exists
        ? prev.favoriteGenres.filter((g) => g !== genre)
        : [...prev.favoriteGenres, genre];
      return { ...prev, favoriteGenres: updated };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (prefs.theme) {
        setTheme(prefs.theme);
      }

      await FirebaseData.saveUserPreferences(currentUser.id, prefs);
      onPreferencesUpdated(prefs);
      toast.success('Preferences saved successfully!');
    } catch (err) {
      console.error('Failed to save preferences:', err);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-2 border-b border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-orange-400" />
            Personal Preferences & Playback
          </h2>
          <p className="text-gray-400 text-xs mt-0.5">
            Customize streaming quality, subtitles, appearance, notifications, and privacy
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold text-xs shadow-lg shadow-orange-950/40"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1.5" />
              Save All Settings
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Playback Settings */}
        <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Tv className="w-4 h-4 text-orange-400" />
              Playback & Streaming
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              Controls for video player behavior and stream quality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white text-xs font-semibold">Autoplay Next Episode</Label>
                <p className="text-gray-400 text-[11px]">Start the next series episode automatically</p>
              </div>
              <Switch
                checked={prefs.autoplayNext}
                onCheckedChange={(val) => setPrefs({ ...prefs, autoplayNext: val })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white text-xs font-semibold">Autoplay Video Previews</Label>
                <p className="text-gray-400 text-[11px]">Play trailer previews while hovering titles</p>
              </div>
              <Switch
                checked={prefs.autoplayPreviews}
                onCheckedChange={(val) => setPrefs({ ...prefs, autoplayPreviews: val })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white text-xs font-semibold">Auto-Skip Intros</Label>
                <p className="text-gray-400 text-[11px]">Jump directly to episode content</p>
              </div>
              <Switch
                checked={prefs.skipIntro}
                onCheckedChange={(val) => setPrefs({ ...prefs, skipIntro: val })}
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-800">
              <Label className="text-white text-xs font-semibold">Default Video Quality</Label>
              <Select
                value={prefs.defaultQuality}
                onValueChange={(val: 'auto' | '1080p' | '720p' | '4k') =>
                  setPrefs({ ...prefs, defaultQuality: val })
                }
              >
                <SelectTrigger className="bg-gray-950 border-gray-700 text-white text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-white text-xs">
                  <SelectItem value="auto">Auto (Adaptive bitrate based on speed)</SelectItem>
                  <SelectItem value="4k">4K Ultra HD (High bandwidth)</SelectItem>
                  <SelectItem value="1080p">1080p Full HD (Recommended)</SelectItem>
                  <SelectItem value="720p">720p Standard HD (Data Saver)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white text-xs font-semibold">Default Subtitle Behavior</Label>
              <Select
                value={prefs.subtitles}
                onValueChange={(val: 'on' | 'off' | 'auto') => setPrefs({ ...prefs, subtitles: val })}
              >
                <SelectTrigger className="bg-gray-950 border-gray-700 text-white text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-white text-xs">
                  <SelectItem value="off">Off by default</SelectItem>
                  <SelectItem value="on">Always On</SelectItem>
                  <SelectItem value="auto">Automatic (Only for foreign audio)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 2. Appearance & Language */}
        <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Palette className="w-4 h-4 text-yellow-400" />
              Appearance & Localization
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              Interface style and preferred content language
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-white text-xs font-semibold">Theme Mode</Label>
              <Select
                value={prefs.theme}
                onValueChange={(val: 'dark' | 'light' | 'system') =>
                  setPrefs({ ...prefs, theme: val })
                }
              >
                <SelectTrigger className="bg-gray-950 border-gray-700 text-white text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-white text-xs">
                  <SelectItem value="dark">Dark Cinema Mode (Default)</SelectItem>
                  <SelectItem value="light">Light Theme</SelectItem>
                  <SelectItem value="system">Match System Theme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white text-xs font-semibold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-orange-400" />
                Interface & Audio Language
              </Label>
              <Select
                value={prefs.language}
                onValueChange={(val) => setPrefs({ ...prefs, language: val })}
              >
                <SelectTrigger className="bg-gray-950 border-gray-700 text-white text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-white text-xs">
                  <SelectItem value="English (US)">English (US)</SelectItem>
                  <SelectItem value="English (UK)">English (UK)</SelectItem>
                  <SelectItem value="French">Français</SelectItem>
                  <SelectItem value="Spanish">Español</SelectItem>
                  <SelectItem value="German">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Favorite Genres Selector */}
            <div className="space-y-2 pt-2 border-t border-gray-800">
              <Label className="text-white text-xs font-semibold">
                Favorite Genres (Select your top tastes)
              </Label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {AVAILABLE_GENRES.map((genre) => {
                  const isSelected = prefs.favoriteGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 ${
                        isSelected
                          ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                          : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-orange-400" />}
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Notifications */}
        <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              Notifications & Alerts
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              Manage platform alerts and recommendation emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white text-xs font-semibold">New Movie Premieres</Label>
                <p className="text-gray-400 text-[11px]">Notify me when new 4K titles arrive</p>
              </div>
              <Switch
                checked={prefs.notifications.newReleases}
                onCheckedChange={(val) =>
                  setPrefs({
                    ...prefs,
                    notifications: { ...prefs.notifications, newReleases: val },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white text-xs font-semibold">Personalized Recommendations</Label>
                <p className="text-gray-400 text-[11px]">Receive tailored suggestions based on taste</p>
              </div>
              <Switch
                checked={prefs.notifications.recommendations}
                onCheckedChange={(val) =>
                  setPrefs({
                    ...prefs,
                    notifications: { ...prefs.notifications, recommendations: val },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white text-xs font-semibold">Security & Login Alerts</Label>
                <p className="text-gray-400 text-[11px]">Notify me of new device sign-ins</p>
              </div>
              <Switch
                checked={prefs.notifications.securityAlerts}
                onCheckedChange={(val) =>
                  setPrefs({
                    ...prefs,
                    notifications: { ...prefs.notifications, securityAlerts: val },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* 4. Privacy Settings */}
        <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-400" />
              Privacy & Visibility
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              Control profile visibility and analytics tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white text-xs font-semibold">Public Profile</Label>
                <p className="text-gray-400 text-[11px]">Allow other members to see your reviews</p>
              </div>
              <Switch
                checked={prefs.privacy.profileVisibility === 'public'}
                onCheckedChange={(val) =>
                  setPrefs({
                    ...prefs,
                    privacy: {
                      ...prefs.privacy,
                      profileVisibility: val ? 'public' : 'private',
                    },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white text-xs font-semibold">Private Watch History</Label>
                <p className="text-gray-400 text-[11px]">Keep all streaming activity private to you</p>
              </div>
              <Switch
                checked={prefs.privacy.historyVisibility === 'private'}
                onCheckedChange={(val) =>
                  setPrefs({
                    ...prefs,
                    privacy: {
                      ...prefs.privacy,
                      historyVisibility: val ? 'private' : 'friends',
                    },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

