import { type AnalyticsMetric, isAnalyticsMetric, METRICS } from '@/lib/constants/analytics';

export { METRICS };

/**
 * Tracks an aggregate event through a server route so the browser never
 * receives direct write access to analytics storage.
 */
export async function trackEvent(metricName: AnalyticsMetric) {
  if (!isAnalyticsMetric(metricName)) {
    return;
  }

  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      keepalive: true,
      body: JSON.stringify({
        metric: metricName,
      }),
    });
  } catch {}
}
