import { useState } from 'react';
import { User } from '@/types';
import { FirebaseData } from '@/lib/firebase-data';
import { firebaseAuth } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { User as UserIcon, Camera, Save, RefreshCw, Sparkles } from 'lucide-react';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
  onProfileUpdated: (updated: User) => void;
}

const AVATAR_PRESETS = [
  { label: 'OrangeFlix', url: '/android-chrome-192x192.png' },
  { label: 'Cinema Queen', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  { label: 'Film Critic', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { label: 'Popcorn Fan', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80' },
  { label: 'Cyber Neon', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80' },
];

export default function EditProfileModal({
  open,
  onOpenChange,
  currentUser,
  onProfileUpdated,
}: EditProfileModalProps) {
  const [name, setName] = useState(currentUser.name || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [photoURL, setPhotoURL] = useState(currentUser.photoURL || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }

    setIsSaving(true);
    const cleanedPhotoURL = photoURL.trim();

    try {
      // 1. Update Firebase Auth profile safely
      // Firebase Auth updateProfile rejects photoURL > 2048 chars or large data URIs
      if (firebaseAuth?.currentUser) {
        try {
          const authPhotoURL =
            cleanedPhotoURL.length > 2000 || cleanedPhotoURL.startsWith('data:')
              ? undefined
              : cleanedPhotoURL || undefined;

          await updateProfile(firebaseAuth.currentUser, {
            displayName: name.trim(),
            photoURL: authPhotoURL,
          });
        } catch (authErr) {
          console.warn('[Firebase Auth] Non-fatal profile attribute update warning:', authErr);
        }
      }

      // 2. Update Firestore profile & users collections (Firestore supports full length URLs)
      await FirebaseData.saveProfile(currentUser.id, {
        name: name.trim(),
        photoURL: cleanedPhotoURL,
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
      });

      const updatedUser: User = {
        ...currentUser,
        name: name.trim(),
        username: username.trim().toLowerCase(),
        photoURL: cleanedPhotoURL,
        bio: bio.trim(),
      };

      onProfileUpdated(updatedUser);
      toast.success('Profile updated successfully!');
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error('Failed to save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-orange-500/30 text-white max-w-md shadow-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-orange-400" />
            Edit Profile
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-xs">
            Personalize your public profile, display name, and avatar across OrangeFlix.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Avatar Preview */}
          <div className="space-y-3 p-3.5 rounded-xl bg-gray-950/60 border border-gray-800">
            <div className="flex items-center space-x-4">
              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-800 shrink-0 border border-orange-500/30">
                {photoURL ? (
                  <img src={photoURL} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-lg text-white bg-gradient-to-br from-orange-500 to-yellow-500">
                    {name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor="photoURL" className="text-white text-xs font-semibold flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-orange-400" />
                  Avatar Image URL
                </Label>
                <Input
                  id="photoURL"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder="https://... or /android-chrome-192x192.png"
                  className="bg-gray-900 border-gray-700 text-white text-xs h-8"
                />
              </div>
            </div>

            {/* Quick Avatar Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-400" /> Or pick a preset:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setPhotoURL(preset.url)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform shrink-0 ${
                      photoURL === preset.url
                        ? 'border-orange-500 scale-110 shadow-md shadow-orange-950/60'
                        : 'border-gray-700 hover:border-gray-500 opacity-80 hover:opacity-100'
                    }`}
                    title={preset.label}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-white text-xs font-semibold">
              Full Display Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Alex Morgan"
              className="bg-gray-950 border-gray-700 text-white text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-white text-xs font-semibold">
              Username (Optional)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="alex_cinema"
                className="bg-gray-950 border-gray-700 text-white text-sm pl-7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-white text-xs font-semibold">
              Bio / About Me
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Movie enthusiast, sci-fi binge watcher..."
              rows={2}
              maxLength={160}
              className="bg-gray-950 border-gray-700 text-white text-xs resize-none"
            />
            <div className="flex justify-end text-[10px] text-gray-500">
              {bio.length}/160 characters
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-700 text-gray-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold shadow-lg shadow-orange-950/40"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
