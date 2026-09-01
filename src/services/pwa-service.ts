/**
 * PWA Registration & Service Worker Management
 */

export class PwaService {
  private static isRegistered = false;

  static registerServiceWorker(): void {
    if (typeof window === 'undefined' || this.isRegistered) return;
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            this.isRegistered = true;
            console.info('[PWA] Service Worker successfully registered:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }
  }
}
