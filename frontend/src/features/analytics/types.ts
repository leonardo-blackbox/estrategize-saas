// Tipos compartilhados da feature Analytics

export type FilterOption = 'all' | 'today' | '7d' | '30d' | 'custom';
export type UTMMode = 'leads' | 'views';

export interface DateRange {
  from: string;
  to: string;
}
