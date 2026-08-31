/**
 * OrangeFlix Unified Email Delivery Service (Brevo / Sendinblue API & Branded HTML Templates)
 * Sender: orangeflix.service@gmail.com
 * Conforms strictly to OrangeFlix dark theme & vibrant orange branding (#070b14, #f97316).
 */

export interface SendEmailOptions {
  email: string;
  name?: string;
}

export interface SendPasswordResetOptions extends SendEmailOptions {
  resetUrl: string;
}

export interface MovieDigestItem {
  id: string | number;
  title: string;
  posterUrl: string;
  genre?: string;
  rating?: number | string;
  country?: string;
  streamUrl: string;
}

export interface SendReEngagementOptions extends SendEmailOptions {
  locationName?: string;
  countryCode?: string;
  trendingMovies?: MovieDigestItem[];
}

export type CampaignEmailKind = 'welcome' | 'invitation' | 'announcement' | 'retention' | 'security';

export interface SendCampaignEmailOptions extends SendEmailOptions {
  kind: CampaignEmailKind;
  subject?: string;
  message?: string;
  actionLabel?: string;
  actionUrl?: string;
}

export interface BrevoEmailResponse {
  messageId?: string;
  code?: string;
  message?: string;
}

export class EmailService {
  private static readonly BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
  public static readonly SENDER_EMAIL = 'orangeflix.service@gmail.com';
  public static readonly SENDER_NAME = 'OrangeFlix Service & Security';

  /**
   * Check if a valid, authenticated Brevo API key is available in the environment
   */
  static isConfigured(): boolean {
    const key = this.getBrevoApiKey();
    if (!key) return false;
    const trimmed = key.trim();
    if (
      trimmed.startsWith('your_') ||
      trimmed.includes('example') ||
      trimmed.length < 20
    ) {
      return false;
    }
    return true;
  }

  private static getBrevoApiKey(): string {
    return import.meta.env.VITE_BREVO_API_KEY || '';
  }

  /**
   * Common HTML email header wrapper
   */
  private static getEmailHeader(badgeText: string = 'Cinema & Streaming'): string {
    return `
      <div class="header">
        <img src="https://orangeflixx.vercel.app/android-chrome-192x192.png" width="52" height="52" alt="OrangeFlix logo" style="display:block;width:52px;height:52px;margin:0 auto 10px;border-radius:12px;" />
        <div class="logo-badge">
          Orange<span class="logo-orange">Flix</span>
        </div>
        <br>
        <span class="pill">${badgeText}</span>
      </div>
    `;
  }

  /**
   * Common HTML email footer wrapper
   */
  private static getEmailFooter(): string {
    return `
      <div class="footer">
        <p>© 2026 OrangeFlix Cinema. All rights reserved.<br>
        Engineered with passion by Gilbert Tuyambaze • Kigali, Rwanda.<br>
        Need help or have questions? Reach us at <a href="mailto:${this.SENDER_EMAIL}" style="color: #f97316; text-decoration: underline;">${this.SENDER_EMAIL}</a><br>
        <a href="https://orangeflixx.vercel.app/security" style="color: #94a3b8; text-decoration: underline;">Security Architecture</a> • 
        <a href="https://orangeflixx.vercel.app/privacy" style="color: #94a3b8; text-decoration: underline;">Privacy Policy</a> • 
        <a href="https://orangeflixx.vercel.app/story-behind" style="color: #94a3b8; text-decoration: underline;">The Story Behind</a></p>
      </div>
    `;
  }

  /**
   * Base email HTML styling
   */
  private static getEmailStyles(): string {
    return `
      body {
        margin: 0;
        padding: 0;
        width: 100%;
        background-color: #070b14;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #e2e8f0;
        -webkit-font-smoothing: antialiased;
      }
      .wrapper {
        width: 100%;
        box-sizing: border-box;
        background-color: #070b14;
        padding: 0;
      }
      .container {
        width: 100%;
        max-width: none;
        min-height: 100vh;
        margin: 0;
        box-sizing: border-box;
        background: linear-gradient(180deg, #0d1527 0%, #080c16 100%);
        border: 1px solid rgba(249, 115, 22, 0.3);
        border-radius: 0;
        overflow: hidden;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85);
      }
      .header {
        padding: 32px 24px 20px;
        text-align: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        background: radial-gradient(circle at top, rgba(249, 115, 22, 0.18), transparent 70%);
      }
      .logo-badge {
        display: inline-block;
        font-size: 26px;
        font-weight: 900;
        color: #ffffff;
        letter-spacing: -0.5px;
        text-decoration: none;
      }
      .logo-orange {
        color: #f97316;
      }
      .pill {
        display: inline-block;
        margin-top: 10px;
        padding: 4px 14px;
        background-color: rgba(249, 115, 22, 0.12);
        border: 1px solid rgba(249, 115, 22, 0.35);
        border-radius: 999px;
        color: #fb923c;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .content {
        padding: 32px 28px;
      }
      h1 {
        margin: 0 0 16px;
        font-size: 22px;
        font-weight: 800;
        color: #ffffff;
        text-align: center;
        line-height: 1.3;
      }
      p {
        margin: 0 0 16px;
        font-size: 14px;
        line-height: 1.6;
        color: #94a3b8;
      }
      .feature-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 14px 16px;
        margin-bottom: 12px;
      }
      .feature-title {
        font-size: 13px;
        font-weight: 700;
        color: #f97316;
        margin-bottom: 4px;
      }
      .feature-desc {
        font-size: 12px;
        color: #cbd5e1;
        margin: 0;
        line-height: 1.4;
      }
      .btn-container {
        text-align: center;
        margin: 28px 0 20px;
      }
      .btn {
        display: inline-block;
        padding: 14px 34px;
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
        color: #ffffff !important;
        text-decoration: none;
        font-size: 14px;
        font-weight: 700;
        border-radius: 12px;
        box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
      }
      .url-box {
        background-color: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 12px 14px;
        word-break: break-all;
        font-size: 12px;
        color: #f97316;
        margin-bottom: 20px;
      }
      .security-box {
        background-color: rgba(249, 115, 22, 0.08);
        border-left: 3px solid #f97316;
        padding: 12px 16px;
        border-radius: 0 8px 8px 0;
        margin-top: 24px;
      }
      .security-box p {
        margin: 0;
        font-size: 12px;
        color: #cbd5e1;
      }
      .movie-grid {
        display: table;
        width: 100%;
        margin: 20px 0;
      }
      .movie-item {
        display: table-cell;
        width: 33.33%;
        padding: 6px;
        vertical-align: top;
        text-align: center;
      }
      .movie-poster {
        width: 100%;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: block;
        margin-bottom: 6px;
      }
      .movie-title {
        font-size: 11px;
        font-weight: 700;
        color: #ffffff;
        margin: 0 0 2px;
        line-height: 1.2;
      }
      .movie-tag {
        font-size: 10px;
        color: #f97316;
        margin: 0;
      }
      .footer {
        padding: 24px 28px;
        text-align: center;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        font-size: 11px;
        color: #64748b;
        line-height: 1.6;
      }
      @media only screen and (max-width: 600px) {
        .header {
          padding: 28px 16px 18px;
        }
        .content {
          padding: 28px 18px;
        }
        .footer {
          padding: 22px 18px;
        }
        .btn {
          max-width: 100%;
          box-sizing: border-box;
        }
        .movie-item {
          padding: 4px;
        }
      }
    `;
  }

  // =========================================================================
  // 1. ACCOUNT CREATION CONGRATULATIONS / WELCOME EMAIL
  // =========================================================================
  static generateWelcomeHtml(options: SendEmailOptions): string {
    const { email, name } = options;
    const recipientName = name || email.split('@')[0] || 'Film Enthusiast';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to OrangeFlix</title>
  <style>${this.getEmailStyles()}</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      ${this.getEmailHeader('Welcome to the Community 🎉')}

      <div class="content">
        <h1>Welcome to OrangeFlix, ${recipientName}! 🎬</h1>
        <p>Congratulations! Your <strong>OrangeFlix</strong> account (<code>${email}</code>) is now officially active. You have unlocked unlimited access to the finest African and global cinema storytelling.</p>

        <div class="feature-card">
          <div class="feature-title">🌍 African Geo Cinema Portals</div>
          <p class="feature-desc">Explore curated cinematic territory portals for Rwanda (🇷🇼), Uganda Wakaliwood (🇺🇬), Kenya Riverwood (🇰🇪), Nigeria Nollywood (🇳🇬), Ghana (🇬🇭), Tanzania (🇹🇿), and South Africa (🇿🇦).</p>
        </div>

        <div class="feature-card">
          <div class="feature-title">🎬 3D Card Staging &amp; Discovery</div>
          <p class="feature-desc">Experience our 3D cinema carousel on desktop & mobile with zero-latency instant loading, mood recommendations, and automated 3x-a-week catalog scans.</p>
        </div>

        <div class="feature-card">
          <div class="feature-title">🎧 BeatFlow Movie Soundtracks</div>
          <p class="feature-desc">Stream original cinema score albums, Apple Music previews, waveform visualizations, and film soundtracks directly inside OrangeFlix.</p>
        </div>

        <div class="security-box">
          <img src="https://tuyambaze-gilbert.vercel.app/images/gilbert-tuyambaze-dark.jpeg" width="72" height="72" alt="Gilbert Tuyambaze, founder of OrangeFlix" style="display:block;width:72px;height:72px;object-fit:cover;border-radius:50%;margin:0 auto 12px;border:2px solid #f97316;" />
          <p><strong>A personal welcome from Gilbert Tuyambaze, Founder of OrangeFlix</strong></p>
          <p>Congratulations on joining us. OrangeFlix exists to make African stories easier to discover, celebrate the people behind them, and connect every viewer with cinema that feels personal. Our mission is a thoughtful, welcoming home for African and global film—open to everyone.</p>
          <p>Welcome to the community. I am glad you are here.</p>
        </div>

        <div class="btn-container">
          <a href="https://orangeflixx.vercel.app/" class="btn" target="_blank">Start Streaming Free Now</a>
        </div>

        <div class="security-box">
          <p><strong>Official Support:</strong> If you ever need assistance, feature requests, or technical help, email our engineering team directly at <a href="mailto:${this.SENDER_EMAIL}" style="color: #f97316;">${this.SENDER_EMAIL}</a>.</p>
        </div>
      </div>

      ${this.getEmailFooter()}
    </div>
  </div>
</body>
</html>`;
  }

  // =========================================================================
  // 2. PASSWORD RESET EMAIL
  // =========================================================================
  static generatePasswordResetHtml(options: SendPasswordResetOptions): string {
    const { email, name, resetUrl } = options;
    const recipientName = name?.trim() || 'OrangeFlix Member';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your OrangeFlix Password</title>
  <style>${this.getEmailStyles()}</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      ${this.getEmailHeader('Account Security & Recovery')}

      <div class="content">
        <h1>Reset Your Password</h1>
        <p>Hello <strong>${recipientName}</strong>,</p>
        <p>We received a request to reset your password for your <strong>OrangeFlix</strong> account (<code>${email}</code>). Click the secure button below to choose your new password on the OrangeFlix platform.</p>

        <div class="btn-container">
          <a href="${resetUrl}" class="btn" target="_blank">Reset My Password</a>
        </div>

        <p style="font-size: 12px; color: #64748b; text-align: center;">Or open this link directly in your browser:</p>
        <div class="url-box">
          <a href="${resetUrl}" style="color: #f97316; text-decoration: none;">${resetUrl}</a>
        </div>

        <div class="security-box">
          <p><strong>Security Notice:</strong> This password reset link is valid for 1 hour. If you didn't request a password reset, you can safely ignore this email — your account remains completely secure.</p>
        </div>
      </div>

      ${this.getEmailFooter()}
    </div>
  </div>
</body>
</html>`;
  }

  // =========================================================================
  // 3. PASSWORD CHANGED CONFIRMATION & SECURITY ALERT EMAIL
  // =========================================================================
  static generatePasswordChangedAlertHtml(options: SendEmailOptions): string {
    const { email, name } = options;
    const recipientName = name || email.split('@')[0] || 'Member';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your OrangeFlix Password Was Updated</title>
  <style>${this.getEmailStyles()}</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      ${this.getEmailHeader('Security Notification')}

      <div class="content">
        <h1>Password Successfully Updated 🛡️</h1>
        <p>Hello <strong>${recipientName}</strong>,</p>
        <p>This is an automated confirmation that your <strong>OrangeFlix</strong> password for <code>${email}</code> was successfully updated.</p>

        <div class="feature-card">
          <div class="feature-title">Account Status</div>
          <p class="feature-desc">All active sessions on older devices may require logging in with your new password for continued security.</p>
        </div>

        <div class="btn-container">
          <a href="https://orangeflixx.vercel.app/profile" class="btn" target="_blank">Review Account Security</a>
        </div>

        <div class="security-box">
          <p><strong>Didn't make this change?</strong> If you did not perform this password change, please contact us immediately at <a href="mailto:${this.SENDER_EMAIL}" style="color: #f97316;">${this.SENDER_EMAIL}</a> to lock and recover your account.</p>
        </div>
      </div>

      ${this.getEmailFooter()}
    </div>
  </div>
</body>
</html>`;
  }

  // =========================================================================
  // 4. SMART INACTIVE / RETENTION RE-ENGAGEMENT EMAIL (LOCATION & TRENDING)
  // =========================================================================
  static generateReEngagementHtml(options: SendReEngagementOptions): string {
    const { email, name, locationName = 'African & Global Cinema', trendingMovies } = options;
    const recipientName = name || email.split('@')[0] || 'Movie Lover';

    const defaultMovies: MovieDigestItem[] = [
      {
        id: 'rw-top',
        title: 'Rwanda Cinema Spotlight',
        posterUrl: 'https://tuyambaze-gilbert.vercel.app/images/Screenshot-light.png',
        genre: 'Drama / Culture',
        rating: '⭐ 9.2',
        country: 'Rwanda 🇷🇼',
        streamUrl: 'https://orangeflixx.vercel.app/rw/movies',
      },
      {
        id: 'ug-top',
        title: 'Wakaliwood Action Epics',
        posterUrl: 'https://tuyambaze-gilbert.vercel.app/assets/orangeflix.png',
        genre: 'Action / Comedy',
        rating: '⭐ 9.5',
        country: 'Uganda 🇺🇬',
        streamUrl: 'https://orangeflixx.vercel.app/ug/movies',
      },
      {
        id: 'ng-top',
        title: 'Nollywood Blockbusters',
        posterUrl: 'https://tuyambaze-gilbert.vercel.app/assets/marketplacepro.png',
        genre: 'Drama / Thriller',
        rating: '⭐ 8.9',
        country: 'Nigeria 🇳🇬',
        streamUrl: 'https://orangeflixx.vercel.app/ng/movies',
      },
    ];

    const movieList = trendingMovies && trendingMovies.length > 0 ? trendingMovies.slice(0, 3) : defaultMovies;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We Miss You on OrangeFlix!</title>
  <style>${this.getEmailStyles()}</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      ${this.getEmailHeader('Trending in Your Region 🍿')}

      <div class="content">
        <h1>We Miss You on OrangeFlix, ${recipientName}! 🎬</h1>
        <p>It's been a little while since your last visit. Our automated 3x-a-week discovery scanner has added fresh movies and soundtracks tailored for your region in <strong>${locationName}</strong>!</p>

        <p style="font-weight: 700; color: #ffffff; margin-bottom: 8px;">🔥 Trending Highlights Picked For You:</p>

        <div class="movie-grid">
          ${movieList
            .map(
              (m) => `
            <div class="movie-item">
              <a href="${m.streamUrl}" target="_blank" style="text-decoration: none;">
                <img src="${m.posterUrl}" alt="${m.title}" class="movie-poster" style="aspect-ratio: 2/3; object-fit: cover;">
                <p class="movie-title">${m.title}</p>
                <p class="movie-tag">${m.rating || '⭐ Top Pick'} • ${m.country || 'Featured'}</p>
              </a>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="btn-container">
          <a href="https://orangeflixx.vercel.app/" class="btn" target="_blank">Watch Trending Cinema Free</a>
        </div>

        <div class="feature-card">
          <div class="feature-title">💡 Did you know?</div>
          <p class="feature-desc">OrangeFlix now features 3D perspective staging, full-length African cinema, sound score albums on BeatFlow, and zero-latency instant caching on mobile & desktop.</p>
        </div>
      </div>

      ${this.getEmailFooter()}
    </div>
  </div>
</body>
</html>`;
  }

  // =========================================================================
  // DISPATCH CORE METHODS VIA BREVO REST API (WITH ROBUST LOGGING)
  // =========================================================================

  private static async sendViaBrevo(
    toEmail: string,
    toName: string,
    subject: string,
    htmlContent: string
  ): Promise<boolean> {
    const brevoApiKey = this.getBrevoApiKey();
    if (!this.isConfigured()) {
      console.info(
        `[EmailService] Brevo API Key not configured (development simulation active). Simulated dispatch for "${subject}" to: ${toEmail}`
      );
      return true;
    }

    try {
      const payload = {
        sender: {
          name: this.SENDER_NAME,
          email: this.SENDER_EMAIL,
        },
        to: [
          {
            email: toEmail,
            name: toName || toEmail.split('@')[0],
          },
        ],
        subject,
        htmlContent,
      };

      const res = await fetch(this.BREVO_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': brevoApiKey.trim(),
          accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        console.log(`[EmailService] Email dispatched successfully to: ${toEmail} | Subject: "${subject}"`);
        return true;
      } else {
        const errData = (await res.json().catch(() => ({}))) as BrevoEmailResponse;
        if (res.status === 401) {
          console.error(
            '[EmailService] Brevo rejected the API key. Check the VITE_BREVO_API_KEY used by the running build and restart or redeploy after changing it.'
          );
        } else {
          console.warn(`[EmailService] Brevo API returned error (${res.status}):`, errData);
        }
      }
    } catch (err) {
      console.error(`[EmailService] Network exception sending email via Brevo:`, err);
    }

    return false;
  }

  /**
   * Dispatch Welcome / Account Creation Congratulations Email
   */
  static async sendWelcomeEmail(options: SendEmailOptions): Promise<boolean> {
    const html = this.generateWelcomeHtml(options);
    return await this.sendViaBrevo(
      options.email,
      options.name || options.email.split('@')[0],
      '🎬 Welcome to OrangeFlix — Your African & Global Cinema Journey Begins!',
      html
    );
  }

  /**
   * Dispatch Password Reset Email
   */
  static async sendPasswordResetEmail(options: SendPasswordResetOptions): Promise<boolean> {
    const html = this.generatePasswordResetHtml(options);
    return await this.sendViaBrevo(
      options.email,
      options.name || options.email.split('@')[0],
      '🔒 Reset your OrangeFlix account password',
      html
    );
  }

  /**
   * Dispatch Password Changed Confirmation Email
   */
  static async sendPasswordChangedAlert(options: SendEmailOptions): Promise<boolean> {
    const html = this.generatePasswordChangedAlertHtml(options);
    return await this.sendViaBrevo(
      options.email,
      options.name || options.email.split('@')[0],
      '🛡️ Security Alert: Your OrangeFlix password was updated',
      html
    );
  }

  /**
   * Dispatch Inactive User / Trending Re-Engagement Email
   */
  static async sendReEngagementEmail(options: SendReEngagementOptions): Promise<boolean> {
    const html = this.generateReEngagementHtml(options);
    const location = options.locationName || 'African & World Cinema';
    return await this.sendViaBrevo(
      options.email,
      options.name || options.email.split('@')[0],
      `🍿 We miss you on OrangeFlix! Top Trending in ${location} this week`,
      html
    );
  }

  /** Branded, admin-authored transactional and campaign messages. */
  static async sendCampaignEmail(options: SendCampaignEmailOptions): Promise<boolean> {
    const recipientName = options.name || options.email.split('@')[0] || 'OrangeFlix member';
    const defaults: Record<CampaignEmailKind, { subject: string; badge: string; title: string; body: string; action: string; url: string }> = {
      welcome: {
        subject: 'Welcome to OrangeFlix', badge: 'Member onboarding', title: `Welcome, ${recipientName}!`,
        body: 'Your OrangeFlix account is ready. Discover remarkable African and global cinema, save your favourites, and continue watching wherever you left off.', action: 'Explore OrangeFlix', url: 'https://orangeflixx.vercel.app/',
      },
      invitation: {
        subject: 'You are invited to OrangeFlix', badge: 'Private invitation', title: 'Your next great story is waiting',
        body: 'We would love to welcome you to OrangeFlix—your home for thoughtful cinema discovery, watchlists, and personal recommendations.', action: 'Accept invitation', url: 'https://orangeflixx.vercel.app/register',
      },
      announcement: {
        subject: 'New on OrangeFlix', badge: 'Platform update', title: 'A fresh reason to press play',
        body: 'There is something new to discover on OrangeFlix. Visit your home screen for curated releases and cinema selected for you.', action: 'See what is new', url: 'https://orangeflixx.vercel.app/new',
      },
      retention: {
        subject: 'Your OrangeFlix watchlist misses you', badge: 'Made for your next watch', title: 'Your next story is still here',
        body: 'New films and series have arrived since your last visit. Pick up where you left off or explore a recommendation made for you.', action: 'Continue watching', url: 'https://orangeflixx.vercel.app/profile',
      },
      security: {
        subject: 'OrangeFlix account security update', badge: 'Account security', title: 'A quick account notice',
        body: 'This is an official OrangeFlix account notification. If you did not expect this message, contact our support team immediately.', action: 'Review account security', url: 'https://orangeflixx.vercel.app/security',
      },
    };
    const template = defaults[options.kind];
    const body = options.message?.trim() || template.body;
    const actionLabel = options.actionLabel?.trim() || template.action;
    const actionUrl = options.actionUrl?.trim() || template.url;
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${this.getEmailStyles()}</style></head><body><div class="wrapper"><div class="container">${this.getEmailHeader(template.badge)}<div class="content"><h1>${template.title}</h1><p>Hello ${recipientName},</p><p>${body}</p><div class="btn-container"><a class="btn" href="${actionUrl}">${actionLabel}</a></div><div class="security-box"><p>This message was sent by OrangeFlix Service & Security. For support, contact <a href="mailto:${this.SENDER_EMAIL}" style="color:#f97316">${this.SENDER_EMAIL}</a>.</p></div></div>${this.getEmailFooter()}</div></div></body></html>`;
    return this.sendViaBrevo(options.email, recipientName, options.subject?.trim() || template.subject, html);
  }
}
