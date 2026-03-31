import type { BillFrequency } from '@/types';

interface BillTemplate {
  name: string;
  icon: string;
  frequency: BillFrequency;
}

export const UAE_BILL_TEMPLATES: BillTemplate[] = [
  { name: 'DEWA', icon: 'Zap', frequency: 'monthly' },
  { name: 'Etisalat', icon: 'Wifi', frequency: 'monthly' },
  { name: 'du', icon: 'Wifi', frequency: 'monthly' },
  { name: 'Rent (Ejari)', icon: 'Home', frequency: 'quarterly' },
  { name: 'Car Insurance', icon: 'Shield', frequency: 'annual' },
  { name: 'Health Insurance', icon: 'Heart', frequency: 'annual' },
];
