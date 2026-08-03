import posthog from 'posthog-js';

let initialized = false;

/** Initializes PostHog once at app startup. Safe no-op if keys are not configured. */
export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com';

  if (!key || initialized) return;

  posthog.init(key, {
    api_host: host,
    capture_pageview: false,
    autocapture: true,
    persistence: 'localStorage+cookie',
  });
  initialized = true;
}

export function identifyUser(userId: string, traits: Record<string, unknown>) {
  if (!initialized) return;
  posthog.identify(userId, traits);
}

export function resetAnalyticsUser() {
  if (!initialized) return;
  posthog.reset();
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function trackPageview(path: string) {
  if (!initialized) return;
  posthog.capture('$pageview', { $current_url: path });
}
