import type { ConsultancyPriority, ActionPriority } from './services/consultorias.api.ts';

export type BaseTabKey =
  | 'overview'
  | 'ai'
  | 'documentos'
  | 'diagnosis'
  | 'actions'
  | 'deliverables'
  | 'memory'
  | 'dados';

export type PluginTabKey = 'meetings';

export type TabKey = BaseTabKey | PluginTabKey;

export interface TabDef {
  key: TabKey;
  label: string;
}

// Base tabs — always visible (no meetings here, it's a plugin tab)
export const BASE_TABS: TabDef[] = [
  { key: 'overview',     label: 'Visão Geral' },
  { key: 'ai',           label: 'Chat IA' },
  { key: 'documentos',   label: 'Documentos' },
  { key: 'diagnosis',    label: 'Diagnóstico' },
  { key: 'actions',      label: 'Plano de Ação' },
  { key: 'deliverables', label: 'Entregáveis' },
  { key: 'memory',       label: 'Memória IA' },
  { key: 'dados',        label: 'Dados' },
];

// Tabs added by plugins (slug → tab definition)
export const PLUGIN_TAB_MAP: Record<string, TabDef> = {
  'transcricao-reuniao': { key: 'meetings', label: 'Reuniões' },
};

// Legacy TABS export for backwards compat (used by old imports if any)
export const TABS = BASE_TABS;

export type AnyPriority = ConsultancyPriority | ActionPriority;
