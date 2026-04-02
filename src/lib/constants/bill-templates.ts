import type { BillFrequency } from '@/types';

interface BillTemplate {
  name: string;
  icon: string;
  frequency: BillFrequency;
}

export const GLOBAL_BILL_TEMPLATES: BillTemplate[] = [
  { name: 'Electricity & Water', icon: 'Zap', frequency: 'monthly' },
  { name: 'Internet & Mobile', icon: 'Wifi', frequency: 'monthly' },
  { name: 'Rent / Mortgage', icon: 'Home', frequency: 'monthly' },
  { name: 'Insurance', icon: 'Shield', frequency: 'monthly' },
  { name: 'Subscriptions', icon: 'Heart', frequency: 'monthly' },
];
