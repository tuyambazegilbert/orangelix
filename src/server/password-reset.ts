import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function getFirebaseAdminAuth() {
  const app = getApps().length
    ? getApp()
    : initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')),
      });
  return getAuth(app);
}

export async function generatePasswordResetLink(
  email: string,
  continueUrl: string
): Promise<{ resetUrl: string; recipientName?: string }> {
  if (!email || !continueUrl) throw new Error('Email and continueUrl are required.');

  const auth = getFirebaseAdminAuth();
  const firebaseLink = await auth.generatePasswordResetLink(email, {
    url: continueUrl,
    handleCodeInApp: true,
  });
  const firebaseLinkUrl = new URL(firebaseLink);
  const oobCode = firebaseLinkUrl.searchParams.get('oobCode');
  if (!oobCode) throw new Error('Firebase did not return a reset token.');

  const appResetUrl = new URL(continueUrl);
  appResetUrl.searchParams.set('mode', 'resetPassword');
  appResetUrl.searchParams.set('oobCode', oobCode);
  const user = await auth.getUserByEmail(email);
  const recipientName = user.displayName?.trim() || undefined;

  return { resetUrl: appResetUrl.toString(), recipientName };
}