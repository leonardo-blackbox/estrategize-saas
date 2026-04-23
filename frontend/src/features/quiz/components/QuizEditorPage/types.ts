import type { ApplicationField, FieldType } from '../../../../api/applications.ts';

export interface EditorField extends Omit<Partial<ApplicationField>, 'type' | 'options'> {
  localId: string;
  type: FieldType;
  title: string;
  required: boolean;
  options: unknown;
  conditional_logic?: unknown;
}
