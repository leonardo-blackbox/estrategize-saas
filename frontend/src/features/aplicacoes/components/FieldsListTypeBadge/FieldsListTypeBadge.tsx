import { type FieldType } from '../../../../api/applications.ts';

const FIELD_TYPE_META: Record<FieldType, { label: string; icon: string }> = {
  welcome: { label: 'Boas-vindas', icon: 'Hi' },
  message: { label: 'Mensagem', icon: '\u00B6' },
  short_text: { label: 'Texto Curto', icon: 'Aa' },
  long_text: { label: 'Texto Longo', icon: '\u2630' },
  name: { label: 'Nome', icon: 'Ab' },
  email: { label: 'E-mail', icon: '@' },
  phone: { label: 'Telefone', icon: 'Tel' },
  multiple_choice: { label: 'Multipla', icon: '\u25C9' },
  number: { label: 'Numero', icon: '#' },
  date: { label: 'Data', icon: 'Dt' },
  thank_you: { label: 'Agradecimento', icon: '\u2713' },
};

const TYPE_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  short_text: { bg: 'rgba(50,173,230,0.12)', text: '#32ade6' },
  long_text: { bg: 'rgba(50,173,230,0.12)', text: '#32ade6' },
  name: { bg: 'rgba(50,173,230,0.12)', text: '#32ade6' },
  multiple_choice: { bg: 'rgba(124,92,252,0.12)', text: '#7c5cfc' },
  email: { bg: 'rgba(48,209,88,0.12)', text: '#30d158' },
  phone: { bg: 'rgba(48,209,88,0.12)', text: '#30d158' },
  number: { bg: 'rgba(255,159,10,0.12)', text: '#ff9f0a' },
  date: { bg: 'rgba(100,210,255,0.12)', text: '#64d2ff' },
  welcome: { bg: 'rgba(110,110,115,0.12)', text: '#8e8e93' },
  message: { bg: 'rgba(110,110,115,0.12)', text: '#8e8e93' },
  thank_you: { bg: 'rgba(48,209,88,0.12)', text: '#30d158' },
};

export function FieldsListTypeBadge({ type }: { type: FieldType }) {
  const meta = FIELD_TYPE_META[type];
  const color = TYPE_BADGE_COLORS[type] ?? { bg: 'rgba(110,110,115,0.12)', text: '#8e8e93' };

  return (
    <span
      className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-none"
      style={{ background: color.bg, color: color.text }}
    >
      {meta.icon} <span className="ml-1">{meta.label}</span>
    </span>
  );
}
