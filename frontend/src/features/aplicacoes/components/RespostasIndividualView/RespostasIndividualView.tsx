import { motion, AnimatePresence } from 'framer-motion';
import type { ResponseWithAnswers, ApplicationField } from '../../services/aplicacoes.api';
import { resolveValue, UTM_KEYS, UTM_COLORS } from '../../utils/respostas.helpers';
import { RespostasDetailHeader } from '../RespostasDetailHeader';

interface RespostasIndividualViewProps {
  response: ResponseWithAnswers;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onDelete: (id: string) => void;
  direction: 'forward' | 'back';
  showUTM: boolean;
  fields: ApplicationField[];
}

export function RespostasIndividualView({
  response, index, total, onPrev, onNext, onDelete, direction, showUTM, fields,
}: RespostasIndividualViewProps) {
  const xOffset = direction === 'forward' ? 32 : -32;
  const utmEntries = UTM_KEYS.filter((k) => response.metadata?.[k] && response.metadata[k] !== '');
  const displayAnswers = response.answers.filter(
    (a) => a.field_type !== 'welcome' && a.field_type !== 'thank_you' && a.field_type !== 'message',
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={response.id}
        initial={{ opacity: 0, x: xOffset }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -xOffset }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{ padding: '20px 32px 40px', maxWidth: 760, width: '100%' }}
      >
        <RespostasDetailHeader
          responseId={response.id}
          submittedAt={response.submitted_at || response.created_at}
          index={index}
          total={total}
          onPrev={onPrev}
          onNext={onNext}
          onDelete={onDelete}
        />

        {showUTM && utmEntries.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
            {utmEntries.map((k) => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${UTM_COLORS[k]}15`, border: `1px solid ${UTM_COLORS[k]}30`, color: UTM_COLORS[k], letterSpacing: '0.02em' }}>
                <span style={{ opacity: 0.6, fontWeight: 400 }}>{k.replace('utm_', '')}</span>
                {response.metadata[k]}
              </span>
            ))}
          </div>
        )}

        {displayAnswers.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Nenhuma resposta registrada.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {displayAnswers.map((answer, i) => (
              <div key={answer.field_id}>
                <div style={{ padding: '16px 0' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#7c5cfc', marginBottom: 6, lineHeight: 1.4 }}>{answer.field_title}</div>
                  <div style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.6, wordBreak: 'break-word' }}>
                    {resolveValue(answer, fields) || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Sem resposta</span>}
                  </div>
                </div>
                {i < displayAnswers.length - 1 && <div style={{ height: 1, background: 'var(--border-hairline)' }} />}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
