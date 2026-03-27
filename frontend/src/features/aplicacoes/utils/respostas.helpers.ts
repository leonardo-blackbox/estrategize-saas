import type { ApplicationField, FieldOption, ResponseWithAnswers } from '../../../api/applications';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '\u2014';
  if (typeof value === 'boolean') return value ? 'Sim' : 'N\u00e3o';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

/** Resolves multiple_choice UUIDs to human-readable labels using field definitions. */
export function resolveValue(
  answer: { field_id: string; field_type: string; value: unknown },
  fields: ApplicationField[],
): string {
  if (answer.field_type === 'multiple_choice' && Array.isArray(answer.value)) {
    const field = fields.find((f) => f.id === answer.field_id);
    if (field && Array.isArray(field.options)) {
      const opts = field.options as FieldOption[];
      const labels = (answer.value as string[]).map(
        (id) => opts.find((o) => o.id === id)?.label ?? id,
      );
      return labels.join(', ');
    }
  }
  return formatValue(answer.value);
}

export function getFirstAnswerPreview(response: ResponseWithAnswers): string {
  if (!response.answers || response.answers.length === 0) return 'Sem respostas';
  const first = response.answers.find(
    (a) => a.field_type !== 'welcome' && a.field_type !== 'thank_you' && a.field_type !== 'message',
  );
  return formatValue(first?.value ?? response.answers[0]?.value).slice(0, 40) || '\u2014';
}

export function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}m atr\u00e1s`;
  if (diffHour < 24) return `${diffHour}h atr\u00e1s`;
  return `${diffDay}d atr\u00e1s`;
}

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

export const UTM_COLORS: Record<string, string> = {
  utm_source: '#7c5cfc',
  utm_medium: '#0ea5e9',
  utm_campaign: '#10b981',
  utm_term: '#f59e0b',
  utm_content: '#ec4899',
};

export const ICON_BTN_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 30,
  height: 30,
  borderRadius: 6,
  background: 'transparent',
  border: '1px solid var(--border-hairline)',
  color: 'var(--text-tertiary)',
  cursor: 'pointer',
  transition: 'color 0.12s, background 0.12s',
  padding: 6,
};

export type ViewMode = 'individual' | 'tabela';
export type DateFilter = 'all' | 'today' | '7d' | '30d';

/** Filters collectible fields (excludes welcome, thank_you, message). */
export function getCollectibleFields(fields: ApplicationField[]): ApplicationField[] {
  return fields.filter(
    (f) => f.type !== 'welcome' && f.type !== 'thank_you' && f.type !== 'message',
  );
}
