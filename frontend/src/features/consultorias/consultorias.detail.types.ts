import type { ConsultancyPriority, ActionPriority } from './services/consultorias.api.ts';

export type TabKey =
  | 'overview'
  | 'dados'
  | 'diagnosis'
  | 'jornada'
  | 'meetings'
  | 'actions'
  | 'deliverables'
  | 'ai'
  | 'mercado'
  | 'conteudo'
  | 'financeiro'
  | 'arquivos';

export interface TabDef {
  key: TabKey;
  label: string;
}

export const TABS: TabDef[] = [
  { key: 'overview',     label: 'Visão Geral' },
  { key: 'dados',        label: 'Dados' },
  { key: 'diagnosis',    label: 'Diagnóstico' },
  { key: 'jornada',      label: 'Jornada' },
  { key: 'meetings',     label: 'Reuniões' },
  { key: 'actions',      label: 'Plano de Ação' },
  { key: 'deliverables', label: 'Entregáveis' },
  { key: 'ai',           label: 'IA da Consultoria' },
  { key: 'mercado',      label: 'Mercado' },
  { key: 'conteudo',     label: 'Conteúdo' },
  { key: 'financeiro',   label: 'Financeiro' },
  { key: 'arquivos',     label: 'Arquivos' },
];

export type AnyPriority = ConsultancyPriority | ActionPriority;
