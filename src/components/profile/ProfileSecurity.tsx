import { useState } from 'react';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseAuth } from '@/lib/firebase';
import { FirebaseData } from '@/lib/firebase-data';
import { deleteUser, EmailAuthProvider } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Shield,
  KeyRound,
  Download,
  Trash2,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileSecurityProps {
  currentUser: User;
}

export default function ProfileSecurity({ currentUser }: ProfileSecurityProps) {
  const { resetPassword, logout } = useAuth();
  const navigate = useNavigate();

  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [passwordVersion, setPasswordVersion] = useState(0);

  // Check connected providers
  const providers = firebaseAuth?.currentUser?.providerData || [];
  const hasGoogle = providers.some((p) => p.providerId === 'google.com');
  const hasPassword = providers.some((p) => p.providerId === 'password');

  const handlePasswordReset = async () => {
    setIsResetLoading(true);
    try {
      const ok = await resetPassword(currentUser.email);
      if (ok) {
        toast.success('Password reset link sent!', {
          description: `A recovery link was dispatched to ${currentUser.email}`,
        });
      } else {
        toast.error('Failed to send password reset email.');
      }
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!firebaseAuth?.currentUser || !currentUser.email) {
      toast.error('You must be signed in to create a password.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error('Please enter and confirm your new password.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSettingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, newPassword);
      await firebaseAuth.currentUser.linkWithCredential(credential);
      await firebaseAuth.currentUser.reload();
      setPasswordVersion((prev) => prev + 1);
      setNewPassword('');
      setConfirmPassword('');

      toast.success('Password created successfully.', {
        description: 'You can now sign in with your email and password as well as Google.',
      });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('[Set Password Error]', error.code, error.message);

      if (error.code === 'auth/provider-already-linked') {
        toast.error('A password is already linked to this account.');
      } else if (error.code === 'auth/invalid-credential') {
        toast.error('This password could not be linked. Please try again.');
      } else {
        toast.error('Failed to create password. Please try again.');
      }
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const exportData = await FirebaseData.exportFullUserData(currentUser.id);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `orangeflix-userdata-${currentUser.id}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success('User data exported successfully!');
    } catch (err) {
      console.error('Failed to export user data:', err);
      toast.error('Failed to export user data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm.');
      return;
    }

    setIsDeleting(true);
    try {
      // 1. Delete Firestore database data
      await FirebaseData.deleteUserAccountData(currentUser.id);

      // 2. Delete Firebase Auth user
      if (firebaseAuth?.currentUser) {
        await deleteUser(firebaseAuth.currentUser);
      }

      toast.success('Your account and associated data have been permanently deleted.');
      logout();
      navigate('/');
    } catch (err: unknown) {
      const error = err as { code?: string };
      console.error('Account deletion error:', err);
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Recent authentication required', {
          description: 'For security, please log out, log back in, and try deleting again.',
        });
      } else {
        toast.error('Failed to delete account. Please contact support.');
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="pb-2 border-b border-gray-800">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-orange-400" />
          Security, Connected Accounts & Data
        </h2>
        <p className="text-gray-400 text-xs mt-0.5">
          Manage your login credentials, connected authentication providers, and data portability
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Connected Accounts */}
        <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-orange-400" />
              Connected Identity Providers
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              All providers are unified under your canonical UID
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Provider */}
            <div className="p-3.5 rounded-xl bg-gray-950/70 border border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <div>
                  <h4 className="text-white font-bold text-xs">Google Authentication</h4>
                  <p className="text-[11px] text-gray-400">{hasGoogle ? 'Connected & Active' : 'Not Linked'}</p>
                </div>
              </div>
              {hasGoogle ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Linked
                </Badge>
              ) : (
                <Badge variant="outline" className="border-gray-700 text-gray-400 text-[10px]">
                  Unlinked
                </Badge>
              )}
            </div>

            {/* Email / Password Provider */}
            <div className="p-3.5 rounded-xl bg-gray-950/70 border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xs">Email & Password</h4>
                    <p className="text-[11px] text-gray-400">{currentUser.email}</p>
                  </div>
                </div>
                <Badge
                  className={
                    hasPassword
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]'
                  }
                >
                  {hasPassword ? 'Password set' : 'No password'}
                </Badge>
              </div>

              {hasPassword ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePasswordReset}
                  disabled={isResetLoading}
                  className="border-gray-700 text-gray-300 hover:text-white text-xs w-full"
                >
                  {isResetLoading ? 'Sending...' : 'Reset Password'}
                </Button>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wide text-gray-400">New password</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Create a password"
                      className="h-9 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wide text-gray-400">Confirm password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="h-9 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSetPassword}
                    disabled={isSettingPassword}
                    className="bg-orange-500 hover:bg-orange-400 text-white text-xs w-full"
                  >
                    {isSettingPassword ? 'Setting password...' : 'Set Password'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. Active Session */}
        <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Laptop className="w-4 h-4 text-emerald-400" />
              Active Browser Session
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              Information on your current active connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3.5 rounded-xl bg-gray-950/70 border border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-xs">Current Device</h4>
                  <p className="text-[11px] text-gray-400">
                    {navigator.userAgent.includes('Chrome') ? 'Google Chrome' : 'Web Browser'} • Active Now
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                This Device
              </Badge>
            </div>

            <div className="text-xs text-gray-400 flex items-center justify-between pt-1">
              <span>Account Registered:</span>
              <span className="text-white font-mono">
                {new Date(currentUser.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Portability: Export My Data */}
        <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-400" />
              Data Portability & Export
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              Download a complete archive of your profile, history, ratings, and favorites
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-300 text-xs leading-relaxed">
              You can export all your personal OrangeFlix data at any time in structured JSON format.
            </p>
            <Button
              onClick={handleExportData}
              disabled={isExporting}
              variant="outline"
              className="w-full border-gray-700 bg-gray-950 text-white hover:bg-gray-900 text-xs flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Preparing Export...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  Download My Data (.JSON)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 4. Danger Zone */}
        <Card className="bg-red-950/20 border-red-500/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-red-400 text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              Irreversible account deletion actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-300 text-xs leading-relaxed">
              Permanently delete your OrangeFlix account, viewing history, favorites, and preferences.
            </p>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteModal(true)}
              className="w-full bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete My Account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Account Deletion Confirmation Dialog */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-gray-900 border-red-500/40 text-white max-w-md shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-bold text-center text-white">
              Delete OrangeFlix Account
            </DialogTitle>
            <DialogDescription className="text-gray-300 text-center text-xs">
              This action cannot be undone. All your watchlists, favorites, and viewing history will be
              permanently erased.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-gray-300 text-xs">
                To confirm, type <strong className="text-red-400">DELETE MY ACCOUNT</strong> below:
              </Label>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="bg-gray-950 border-gray-700 text-white text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 border-gray-700 text-gray-300 hover:text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteConfirmation !== 'DELETE MY ACCOUNT' || isDeleting}
                onClick={handleDeleteAccount}
                className="flex-1 text-xs"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

