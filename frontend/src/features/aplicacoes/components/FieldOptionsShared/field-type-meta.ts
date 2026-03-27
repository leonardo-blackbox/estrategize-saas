import { type FieldType } from '../../../../api/applications.ts';

export const FIELD_TYPE_META: Record<FieldType, { label: string; icon: string }> = {
  welcome: { label: 'Boas-vindas', icon: '👋' },
  message: { label: 'Mensagem', icon: '💬' },
  short_text: { label: 'Texto Curto', icon: 'Aa' },
  long_text: { label: 'Texto Longo', icon: '☰' },
  name: { label: 'Nome', icon: '👤' },
  email: { label: 'E-mail', icon: '@' },
  phone: { label: 'Telefone', icon: '📞' },
  multiple_choice: { label: 'Múltipla Escolha', icon: '◉' },
  number: { label: 'Número', icon: '#' },
  date: { label: 'Data', icon: '📅' },
  thank_you: { label: 'Agradecimento', icon: '✓' },
};

export const TYPE_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
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
