// Re-exporta tipos e funções de analytics da api central
// Quando migrar completamente, mover a lógica para cá
export type { AnalyticsData, AnalyticsLead } from '../../../api/applications';
export { fetchAnalytics, applicationKeys } from '../../../api/applications';
