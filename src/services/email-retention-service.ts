import { User } from '@/types';
import { EmailService, MovieDigestItem } from './email-service';

const LAST_ACTIVE_KEY = 'orangeflix_last_active_timestamp';
const LAST_RE_ENGAGEMENT_SENT_KEY = 'orangeflix_last_retention_email_sent';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export class EmailRetentionService {
  /**
   * Record that the user is currently active on the platform
   */
  static recordActivity(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
    } catch {
      // ignore storage error
    }
  }

  /**
   * Check if user was inactive for > 7 days and send them an attractive trending digest
   */
  static async checkAndTriggerRetention(
    user: User | null,
    trendingMovies?: MovieDigestItem[]
  ): Promise<boolean> {
    if (!user || !user.email) return false;

    try {
      const now = Date.now();
      const lastActiveRaw = localStorage.getItem(LAST_ACTIVE_KEY);
      const lastSentRaw = localStorage.getItem(LAST_RE_ENGAGEMENT_SENT_KEY);

      const lastActive = lastActiveRaw ? parseInt(lastActiveRaw, 10) : now;
      const lastSent = lastSentRaw ? parseInt(lastSentRaw, 10) : 0;

      // Only send if user hasn't visited in 7 days and we haven't sent a retention email in the last 14 days
      const isInactive = now - lastActive >= SEVEN_DAYS_MS;
      const cooldownPassed = now - lastSent >= SEVEN_DAYS_MS * 2;

      if (isInactive && cooldownPassed) {
        const locationName = user.country ? `${user.country} & Pan-African Cinema` : 'African & Global Cinema';
        
        await EmailService.sendReEngagementEmail({
          email: user.email,
          name: user.name || user.email.split('@')[0],
          locationName,
          trendingMovies,
        });

        localStorage.setItem(LAST_RE_ENGAGEMENT_SENT_KEY, String(now));
        return true;
      }
    } catch (err) {
      console.warn('[EmailRetentionService] Error during retention check:', err);
    } finally {
      this.recordActivity();
    }

    return false;
  }

  /**
   * Send a test / manual re-engagement digest email to any address
   */
  static async simulateRetentionEmail(
    email: string,
    name?: string,
    locationName: string = 'Kigali, Rwanda'
  ): Promise<boolean> {
    return await EmailService.sendReEngagementEmail({
      email,
      name,
      locationName,
    });
  }
}

