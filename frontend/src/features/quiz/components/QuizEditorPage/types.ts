import type { ApplicationField, FieldType, FieldOptions, ConditionalLogic } from '../../../../api/applications.ts';

export interface EditorField extends Omit<Partial<ApplicationField>, 'type' | 'options' | 'conditional_logic'> {
  localId: string;
  type: FieldType;
  title: string;
  required: boolean;
  options: FieldOptions;
  conditional_logic?: ConditionalLogic;
}
