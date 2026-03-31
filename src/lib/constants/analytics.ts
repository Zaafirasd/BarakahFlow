export const METRICS = {
  SIGNUP: 'signups',
  SIGNIN: 'signins',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  TRANSACTION_ADDED: 'transactions_added',
  TRANSACTION_DELETED: 'transactions_deleted',
  BILL_ADDED: 'bills_added',
  BILL_DELETED: 'bills_deleted',
  BUDGET_CREATED: 'budgets_created',
  ZAKAT_ENABLED: 'zakat_enabled',
} as const;

export type AnalyticsMetric = (typeof METRICS)[keyof typeof METRICS];

const analyticsMetricValues = Object.values(METRICS) as AnalyticsMetric[];

export function isAnalyticsMetric(value: string): value is AnalyticsMetric {
  return analyticsMetricValues.includes(value as AnalyticsMetric);
}
