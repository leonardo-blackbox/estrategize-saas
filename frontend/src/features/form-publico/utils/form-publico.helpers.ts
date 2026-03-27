import type { ApplicationField, FieldOption } from '../types';

export const LETTER_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

export function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export function getFieldOptions(field: ApplicationField): FieldOption[] {
  if (Array.isArray(field.options)) return field.options as FieldOption[];
  return [];
}

export function getOptionFromOptions(
  field: ApplicationField,
  key: string,
): unknown {
  if (!Array.isArray(field.options)) {
    return (field.options as Record<string, unknown>)[key];
  }
  return undefined;
}

export function captureUTM(slug: string): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const utm: Record<string, string> = {};
  utmKeys.forEach((key) => {
    const val = params.get(key);
    if (val) utm[key] = val;
  });

  if (Object.keys(utm).length > 0) {
    try {
      sessionStorage.setItem(`iris_utm_${slug}`, JSON.stringify(utm));
    } catch { /* ignore */ }
  } else {
    try {
      const stored = sessionStorage.getItem(`iris_utm_${slug}`);
      if (stored) return JSON.parse(stored) as Record<string, string>;
    } catch { /* ignore */ }
  }
  return utm;
}

export function captureMetaClickData(slug: string): { fbclid?: string; fbc?: string; fbp?: string } {
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get('fbclid') ?? undefined;

  let fbc: string | undefined;
  let fbp: string | undefined;

  try {
    const cookies = Object.fromEntries(
      document.cookie.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k, v.join('=')];
      }),
    );
    fbc = cookies['_fbc'] || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined);
    fbp = cookies['_fbp'] || undefined;
  } catch { /* ignore */ }

  try {
    if (fbc || fbp || fbclid) {
      const existing = JSON.parse(sessionStorage.getItem(`iris_meta_${slug}`) ?? '{}') as Record<string, string>;
      const merged = { ...existing, ...(fbc && { fbc }), ...(fbp && { fbp }), ...(fbclid && { fbclid }) };
      sessionStorage.setItem(`iris_meta_${slug}`, JSON.stringify(merged));
    } else {
      const stored = sessionStorage.getItem(`iris_meta_${slug}`);
      if (stored) {
        const d = JSON.parse(stored) as { fbc?: string; fbp?: string; fbclid?: string };
        return d;
      }
    }
  } catch { /* ignore */ }

  return { fbclid, fbc, fbp };
}

export const inputBaseStyle = (_buttonColor: string, answerColor: string): React.CSSProperties => ({
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  padding: '16px 20px',
  fontSize: 18,
  color: answerColor,
  width: '100%',
  maxWidth: 560,
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  fontFamily: 'inherit',
});

export const DEFAULT_THEME = {
  backgroundColor: '#000000',
  questionColor: '#f5f5f7',
  answerColor: '#f5f5f7',
  buttonColor: '#7c5cfc',
  buttonTextColor: '#ffffff',
  fontFamily: 'Inter',
  borderRadius: 12,
  logoPosition: 'left' as const,
};

export const DEFAULT_SETTINGS: import('../types').FormSettings = {
  limitOneResponsePerSession: false,
  showProgressBar: true,
  showQuestionNumbers: true,
  thankYouTitle: 'Obrigado!',
  thankYouMessage: 'Suas respostas foram recebidas.',
};
