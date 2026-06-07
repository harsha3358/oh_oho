import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import * as Sentry from "@sentry/react";
import posthog from 'posthog-js';

// Initialize Telemetry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: 1.0, 
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enabled: !!import.meta.env.VITE_SENTRY_DSN
});

posthog.init(import.meta.env.VITE_POSTHOG_KEY || "", {
  api_host: 'https://app.posthog.com',
  autocapture: false, // Opt-in based
  opt_out_capturing_by_default: true, // Only track if explicitly opted-in
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
