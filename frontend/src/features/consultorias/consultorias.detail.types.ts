import type { ConsultancyPriority, ActionPriority } from './services/consultorias.api.ts';

export type TabKey =
  | 'overview'
  | 'ai'
  | 'meetings'
  | 'documentos'
  | 'diagnosis'
  | 'actions'
  | 'deliverables'
  | 'memory'
  | 'dados';

export interface TabDef {
  key: TabKey;
  label: string;
}

export const TABS: TabDef[] = [
  { key: 'overview',     label: 'Visão Geral' },
  { key: 'ai',           label: 'Chat IA' },
  { key: 'meetings',     label: 'Reuniões' },
  { key: 'documentos',   label: 'Documentos' },
  { key: 'diagnosis',    label: 'Diagnóstico' },
  { key: 'actions',      label: 'Plano de Ação' },
  { key: 'deliverables', label: 'Entregáveis' },
  { key: 'memory',       label: 'Memória IA' },
  { key: 'dados',        label: 'Dados' },
];

export type AnyPriority = ConsultancyPriority | ActionPriority;
