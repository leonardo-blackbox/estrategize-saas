import { DEFAULT_FIELD_OPTIONS, type FieldType, type QuizFieldType, type FieldOptions, type ConditionalLogic } from '../../../../api/applications.ts';
import type { EditorField } from './types.ts';

const EMPTY_CONDITIONAL_LOGIC: ConditionalLogic = { enabled: false, conditions: [] };

export const FIELD_LABELS: Record<string, string> = {
  welcome: 'Boas-vindas', message: 'Mensagem', short_text: 'Texto curto', long_text: 'Texto longo',
  name: 'Nome', email: 'E-mail', phone: 'Telefone', multiple_choice: 'Múltipla escolha',
  number: 'Número', date: 'Data', thank_you: 'Obrigado', image_choice: 'Escolha com imagem',
  rating: 'Avaliação', opinion_scale: 'Escala', yes_no: 'Sim / Não', ranking: 'Ranking', slider: 'Slider',
};

const questionTitles: Record<string, string> = {
  image_choice: 'Escolha a imagem que combina mais com você', rating: 'Como você avalia este ponto?',
  opinion_scale: 'Em uma escala, quanto você concorda?', yes_no: 'Você já tem isso implementado?',
  ranking: 'Ordene por prioridade', slider: 'Escolha um valor', multiple_choice: 'Escolha uma opção',
  short_text: 'Sua resposta', long_text: 'Conte com mais detalhes', name: 'Qual é seu nome?',
  email: 'Qual é seu e-mail?', phone: 'Qual é seu WhatsApp?', number: 'Informe um número', date: 'Escolha uma data',
  message: 'Mensagem', welcome: 'Bem-vindo(a)!', thank_you: 'Obrigado!',
};

export function defaultOptions(type: FieldType): FieldOptions {
  if (type === 'multiple_choice') return { choices: [{ label: 'Opção 1', value: 'a', scoreValue: 0 }, { label: 'Opção 2', value: 'b', scoreValue: 0 }] };
  if (type in DEFAULT_FIELD_OPTIONS) return DEFAULT_FIELD_OPTIONS[type as QuizFieldType] as FieldOptions;
  if (type === 'welcome') return { buttonText: 'Começar', description: '' };
  return {};
}

export function createEditorField(type: FieldType, position: number): EditorField {
  return { localId: crypto.randomUUID(), position, type, title: questionTitles[type] ?? 'Nova pergunta', required: false, options: defaultOptions(type), conditional_logic: EMPTY_CONDITIONAL_LOGIC };
}

export function toEditorField(field: Partial<EditorField>): EditorField {
  return { localId: crypto.randomUUID(), type: field.type ?? 'short_text', title: field.title ?? '', required: field.required ?? false, options: field.options ?? {}, conditional_logic: field.conditional_logic ?? EMPTY_CONDITIONAL_LOGIC, ...field };
}

export function withoutLeadOnOthers(fields: EditorField[], activeLocalId: string) {
  return fields.map((field) => {
    const options = (field.options ?? {}) as Record<string, unknown>;
    return field.localId === activeLocalId ? field : { ...field, options: { ...options, triggerLeadEvent: false } };
  });
}
