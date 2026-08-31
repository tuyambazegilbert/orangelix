import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept third-party extension errors (e.g. password managers / autofill reporting startTime)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event.message?.includes('startTime') ||
      event.message?.includes('reportAllChanges') ||
      event.filename?.includes('<anonymous>') ||
      event.filename?.includes('chrome-extension://')
    ) {
      event.preventDefault();
      event.stopPropagation();
      console.warn('[Extension Guard] Handled third-party extension error safely:', event.message);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || String(event.reason || '');
    if (reason.includes('startTime') || reason.includes('reportAllChanges')) {
      event.preventDefault();
      console.warn('[Extension Guard] Handled unhandled rejection safely:', reason);
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
