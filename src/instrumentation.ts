import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // All server-side Sentry configuration is now handled here
    // to avoid the ProfilingIntegration constructor error.
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1,
      profilesSampleRate: 1.0,
      enableLogs: true,
      sendDefaultPii: true,
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge config remains separate as it has different requirements.
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
