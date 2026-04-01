import { cn } from '../../../../lib/cn.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { useChatMessages } from '../../hooks/useChatMessages.ts';
import { ConsultoriaDetailMemory } from '../ConsultoriaDetailMemory';

const QUICK_ACTIONS = [
  { label: 'Gerar plano de ação',  prompt: 'Gere um plano de ação estratégico detalhado para esta consultoria.', credits: 4 },
  { label: 'Resumir status',       prompt: 'Resuma o status atual desta consultoria em bullet points.', credits: 1 },
  { label: 'Apontar gargalo',      prompt: 'Qual é o principal gargalo desta consultoria agora?', credits: 1 },
  { label: 'Sugerir conteúdo',     prompt: 'Sugira pautas de conteúdo relevantes para este cliente.', credits: 2 },
];

interface ConsultoriaDetailChatProps {
  consultancyId: string;
  clientName: string | null;
}

export function ConsultoriaDetailChat({ consultancyId, clientName }: ConsultoriaDetailChatProps) {
  const { messages, input, setInput, isThinking, messagesEndRef, textareaRef, sendMessage, handleKeyDown } =
    useChatMessages(consultancyId, clientName);

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[560px]">
      <div className="flex-1 flex flex-col rounded-[var(--radius-md)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] overflow-hidden min-w-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 420 }}>
          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--consulting-ai-gradient, linear-gradient(135deg,#7c5cfc,#b04aff))', color: 'white' }}>✦</div>
              )}
              <div className={cn('max-w-[75%] px-3.5 py-2.5 rounded-[var(--radius-md)] text-sm leading-relaxed',
                msg.role === 'assistant' ? msg.isError ? 'bg-[rgba(255,59,48,0.08)] text-[var(--color-error)] border border-[rgba(255,59,48,0.20)]' : 'bg-[var(--bg-surface-2)] text-[var(--text-primary)]' : 'text-white')}
                style={msg.role === 'user' ? { background: 'var(--consulting-ai-gradient, linear-gradient(135deg,#7c5cfc,#b04aff))' } : undefined}>
                {msg.content}
                {msg.credits_used != null && msg.credits_used > 0 && (
                  <span className="block mt-1 text-[10px] opacity-50">🪙 {msg.credits_used} crédito{msg.credits_used !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex gap-2.5 flex-row">
              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                style={{ background: 'var(--consulting-ai-gradient, linear-gradient(135deg,#7c5cfc,#b04aff))', color: 'white' }}>✦</div>
              <div className="px-3.5 py-2.5 rounded-[var(--radius-md)] bg-[var(--bg-surface-2)] flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]"
                    style={{ animation: `pulse 1.2s ease-in-out ${i * 0.3}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="px-4 py-2 border-t border-[var(--border-hairline)] flex gap-2 overflow-x-auto scrollbar-none">
          {QUICK_ACTIONS.map((qa) => (
            <button key={qa.label} onClick={() => sendMessage(qa.prompt)} disabled={isThinking}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] border border-[var(--border-hairline)] transition-colors disabled:opacity-40">
              {qa.label}<span className="text-[10px] opacity-50">{qa.credits}cr</span>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-[var(--border-hairline)] flex gap-2 items-end">
          <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Mensagem… (Enter para enviar, Shift+Enter para nova linha)" rows={1}
            className="flex-1 resize-none rounded-[var(--radius-md)] bg-[var(--bg-hover)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] px-3 py-2.5 ring-1 ring-inset ring-[var(--border-default)] focus:outline-none focus:ring-2 focus:ring-[var(--consulting-iris,#7c5cfc)] transition-all"
            style={{ minHeight: 40, maxHeight: 120 }} disabled={isThinking} />
          <Button variant="primary" size="sm" onClick={() => sendMessage()} disabled={!input.trim() || isThinking}
            style={{ background: 'var(--consulting-iris, #7c5cfc)' }}>↑</Button>
        </div>
      </div>
      <div className="shrink-0 w-full lg:w-[280px]">
        <ConsultoriaDetailMemory consultancyId={consultancyId} />
      </div>
    </div>
  );
}
