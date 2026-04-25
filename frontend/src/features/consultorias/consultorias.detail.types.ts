import type { ConsultancyPriority, ActionPriority } from './services/consultorias.api.ts';

export type BaseTabKey =
  | 'overview'
  | 'central'
  | 'ai'
  | 'documentos'
  | 'instagram-insights'
  | 'diagnosis'
  | 'actions'
  | 'deliverables'
  | 'memory'
  | 'dados';

export type PluginTabKey = 'meetings' | 'helena' | 'pesquisa';

export type TabKey = BaseTabKey | PluginTabKey;

export interface TabDef {
  key: TabKey;
  label: string;
}

// Base tabs — always visible (no meetings here, it's a plugin tab)
export const BASE_TABS: TabDef[] = [
  { key: 'overview',     label: 'Visão Geral' },
  { key: 'central',      label: 'Central' },
  { key: 'ai',           label: 'Chat IA' },
  { key: 'documentos',   label: 'Documentos' },
  { key: 'instagram-insights', label: 'Instagram Insights' },
  { key: 'diagnosis',    label: 'Diagnóstico' },
  { key: 'actions',      label: 'Plano de Ação' },
  { key: 'deliverables', label: 'Entregáveis' },
  { key: 'memory',       label: 'Memória IA' },
  { key: 'dados',        label: 'Dados' },
];

// Tabs added by plugins (slug → tab definition)
export const PLUGIN_TAB_MAP: Record<string, TabDef> = {
  'transcricao-reuniao': { key: 'meetings', label: 'Reuniões' },
  'helena':              { key: 'helena',   label: 'Helena' },
  'pesquisa-mercado':    { key: 'pesquisa', label: 'Pesquisa de Mercado' },
};

// Legacy TABS export for backwards compat (used by old imports if any)
export const TABS = BASE_TABS;

export type AnyPriority = ConsultancyPriority | ActionPriority;
