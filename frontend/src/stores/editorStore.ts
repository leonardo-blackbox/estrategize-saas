import { create } from 'zustand';
import {
  type ApplicationField,
  type ThemeConfig,
  type FormSettings,
  type FieldType,
  type Application,
  DEFAULT_THEME,
  DEFAULT_SETTINGS,
  updateApplication,
  updateApplicationFields,
} from '../api/applications.ts';

// ─────────────────────────────────────────────
// Local field type (pre-save)
// ─────────────────────────────────────────────

export interface LocalField
  extends Omit<ApplicationField, 'id' | 'application_id' | 'created_at' | 'updated_at'> {
  localId: string;
  id?: string;
}

// ─────────────────────────────────────────────
// Default field titles by type
// ─────────────────────────────────────────────

const DEFAULT_FIELD_TITLES: Record<FieldType, string> = {
  welcome: 'Bem-vindo(a)!',
  message: 'Mensagem',
  short_text: 'Sua resposta',
  long_text: 'Sua resposta',
  name: 'Qual é o seu nome?',
  email: 'Qual é o seu e-mail?',
  phone: 'Qual é o seu WhatsApp?',
  multiple_choice: 'Escolha uma opção',
  number: 'Informe um número',
  date: 'Selecione uma data',
  thank_you: 'Obrigado!',
};

function buildDefaultField(type: FieldType, position: number): LocalField {
  return {
    localId: crypto.randomUUID(),
    position,
    type,
    title: DEFAULT_FIELD_TITLES[type],
    description: undefined,
    required: false,
    options:
      type === 'multiple_choice'
        ? [
            { id: crypto.randomUUID(), label: 'Opção 1' },
            { id: crypto.randomUUID(), label: 'Opção 2' },
          ]
        : {},
    conditional_logic: {
      enabled: false,
      conditions: [],
    },
  };
}

// ─────────────────────────────────────────────
// Store interface
// ─────────────────────────────────────────────

export interface EditorState {
  applicationId: string | null;
  title: string;
  status: 'draft' | 'published' | 'archived';
  themeConfig: ThemeConfig;
  settings: FormSettings;
  fields: LocalField[];
  selectedFieldIndex: number | null;
  previewDevice: 'desktop' | 'mobile';
  isDirty: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  saveError: string | null;
  saveTimer: ReturnType<typeof setTimeout> | null;

  // Load
  loadApplication: (app: Application) => void;

  // Field actions
  addField: (type: FieldType, afterIndex?: number) => void;
  removeField: (index: number) => void;
  reorderFields: (oldIndex: number, newIndex: number) => void;
  updateField: (index: number, updates: Partial<LocalField>) => void;
  selectField: (index: number | null) => void;
  duplicateField: (index: number) => void;

  // Metadata actions
  updateTitle: (title: string) => void;
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  updateSettings: (updates: Partial<FormSettings>) => void;
  setStatus: (status: 'draft' | 'published' | 'archived') => void;
  setPreviewDevice: (device: 'desktop' | 'mobile') => void;

  // Save actions
  scheduleSave: () => void;
  forceSave: () => Promise<void>;
  _performSave: () => Promise<void>;
  reset: () => void;
}

// ─────────────────────────────────────────────
// Store implementation
// ─────────────────────────────────────────────

const INITIAL_STATE = {
  applicationId: null,
  title: '',
  status: 'draft' as const,
  themeConfig: DEFAULT_THEME,
  settings: DEFAULT_SETTINGS,
  fields: [] as LocalField[],
  selectedFieldIndex: null,
  previewDevice: 'desktop' as const,
  isDirty: false,
  saveStatus: 'idle' as const,
  saveError: null,
  saveTimer: null,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  ...INITIAL_STATE,

  // ── Load ──────────────────────────────────────

  loadApplication: (app: Application) => {
    const fields: LocalField[] = (app.fields ?? [])
      .sort((a, b) => a.position - b.position)
      .map((f) => ({
        localId: crypto.randomUUID(),
        id: f.id,
        position: f.position,
        type: f.type,
        title: f.title,
        description: f.description,
        required: f.required,
        options: f.options,
        conditional_logic: f.conditional_logic,
      }));

    set({
      applicationId: app.id,
      title: app.title,
      status: app.status,
      themeConfig: app.theme_config ?? DEFAULT_THEME,
      settings: app.settings ?? DEFAULT_SETTINGS,
      fields,
      selectedFieldIndex: null,
      isDirty: false,
      saveStatus: 'idle',
      saveTimer: null,
    });
  },

  // ── Field actions ─────────────────────────────

  addField: (type: FieldType, afterIndex?: number) => {
    const { fields } = get();

    // Find the thank_you field to always insert before it
    const thankYouIndex = fields.findIndex((f) => f.type === 'thank_you');

    let insertAt: number;
    if (afterIndex !== undefined) {
      insertAt = afterIndex + 1;
    } else if (thankYouIndex !== -1) {
      insertAt = thankYouIndex;
    } else {
      insertAt = fields.length;
    }

    const newField = buildDefaultField(type, insertAt);
    const updated = [...fields];
    updated.splice(insertAt, 0, newField);

    // Recalculate positions
    const reindexed = updated.map((f, i) => ({ ...f, position: i }));

    set({ fields: reindexed, selectedFieldIndex: insertAt, isDirty: true });
    get().scheduleSave();
  },

  removeField: (index: number) => {
    const { fields, selectedFieldIndex } = get();
    const updated = fields.filter((_, i) => i !== index);
    const reindexed = updated.map((f, i) => ({ ...f, position: i }));

    let nextSelected = selectedFieldIndex;
    if (selectedFieldIndex === index) {
      nextSelected = null;
    } else if (selectedFieldIndex !== null && selectedFieldIndex > index) {
      nextSelected = selectedFieldIndex - 1;
    }

    set({ fields: reindexed, selectedFieldIndex: nextSelected, isDirty: true });
    get().scheduleSave();
  },

  reorderFields: (oldIndex: number, newIndex: number) => {
    const { fields } = get();
    const updated = [...fields];
    const [moved] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, moved);
    const reindexed = updated.map((f, i) => ({ ...f, position: i }));

    set({ fields: reindexed, selectedFieldIndex: newIndex, isDirty: true });
    get().scheduleSave();
  },

  updateField: (index: number, updates: Partial<LocalField>) => {
    const { fields } = get();
    const updated = fields.map((f, i) => (i === index ? { ...f, ...updates } : f));
    set({ fields: updated, isDirty: true });
    get().scheduleSave();
  },

  selectField: (index: number | null) => {
    set({ selectedFieldIndex: index });
  },

  duplicateField: (index: number) => {
    const { fields } = get();
    const original = fields[index];
    if (!original) return;

    const duplicate: LocalField = {
      ...original,
      localId: crypto.randomUUID(),
      id: undefined,
      title: `${original.title} (cópia)`,
    };

    const updated = [...fields];
    updated.splice(index + 1, 0, duplicate);
    const reindexed = updated.map((f, i) => ({ ...f, position: i }));

    set({ fields: reindexed, selectedFieldIndex: index + 1, isDirty: true });
    get().scheduleSave();
  },

  // ── Metadata actions ──────────────────────────

  updateTitle: (title: string) => {
    set({ title, isDirty: true });
    get().scheduleSave();
  },

  updateTheme: (updates: Partial<ThemeConfig>) => {
    const { themeConfig } = get();
    set({ themeConfig: { ...themeConfig, ...updates }, isDirty: true });
    get().scheduleSave();
  },

  updateSettings: (updates: Partial<FormSettings>) => {
    const { settings } = get();
    set({ settings: { ...settings, ...updates }, isDirty: true });
    get().scheduleSave();
  },

  setStatus: (status: 'draft' | 'published' | 'archived') => {
    set({ status, isDirty: true });
    get().scheduleSave();
  },

  setPreviewDevice: (device: 'desktop' | 'mobile') => {
    set({ previewDevice: device });
  },

  // ── Save actions ──────────────────────────────

  scheduleSave: () => {
    const { saveTimer } = get();
    if (saveTimer) clearTimeout(saveTimer);

    const timer = setTimeout(() => {
      get()._performSave();
    }, 1500);

    set({ saveTimer: timer });
  },

  forceSave: async () => {
    const { saveTimer } = get();
    if (saveTimer) {
      clearTimeout(saveTimer);
      set({ saveTimer: null });
    }
    await get()._performSave();
  },

  _performSave: async () => {
    const { applicationId, fields, title, status, themeConfig, settings } = get();
    if (!applicationId) return;

    set({ saveStatus: 'saving' });

    try {
      const apiFields = fields.map((f) => ({
        id: f.id,
        position: f.position,
        type: f.type,
        title: f.title,
        description: f.description,
        required: f.required,
        options: f.options,
        conditional_logic: f.conditional_logic,
      }));

      await Promise.all([
        updateApplicationFields(applicationId, apiFields as Parameters<typeof updateApplicationFields>[1]),
        updateApplication(applicationId, {
          title,
          status,
          theme_config: themeConfig,
          settings,
        }),
      ]);

      set({ saveStatus: 'saved', isDirty: false });

      setTimeout(() => {
        set((state) => (state.saveStatus === 'saved' ? { saveStatus: 'idle' } : {}));
      }, 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[EditorStore] _performSave failed:', msg);
      set({ saveStatus: 'error', saveError: msg });
    }
  },

  reset: () => {
    const { saveTimer } = get();
    if (saveTimer) clearTimeout(saveTimer);
    set({ ...INITIAL_STATE });
  },
}));
