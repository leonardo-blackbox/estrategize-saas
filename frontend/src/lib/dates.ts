/**
 * Check if a date string is within 7 days from now (urgent expiry).
 * Designed to be called outside of render for React purity compliance.
 */
const NOW = Date.now();

export function isDaysUrgent(dateStr?: string, thresholdDays = 7): boolean {
  if (!dateStr) return false;
  const daysLeft = Math.ceil((new Date(dateStr).getTime() - NOW) / (1000 * 60 * 60 * 24));
  return daysLeft <= thresholdDays;
}
