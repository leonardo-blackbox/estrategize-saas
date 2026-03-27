import { cn } from '../../../../lib/cn.ts';
import { Modal } from '../../../../components/ui/Modal.tsx';
import type { Material } from '../../formacao.types';

interface FormacaoMaterialModalProps {
  material: Material | null;
  onClose: () => void;
}

export function FormacaoMaterialModal({ material, onClose }: FormacaoMaterialModalProps) {
  return (
    <Modal open={!!material} onClose={onClose} className="sm:max-w-md p-0 overflow-hidden">
      {material && (
        <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
          <div className="p-8 pb-6 border-b border-[var(--color-border-subtle)]">
            <div className="inline-flex items-center rounded-sm bg-[var(--color-bg-active)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4 border border-[var(--color-border-subtle)]">
              {material.type}
            </div>
            <h3 className="text-[24px] font-semibold tracking-tight text-[var(--color-text-primary)] leading-tight mb-3">
              {material.title}
            </h3>
            <div className="flex items-center gap-3 text-[14px] text-[var(--color-text-tertiary)]">
              <span>Adicionado em: {material.uploadedAt}</span>
              <span className="w-1 h-1 rounded-full bg-[var(--color-text-tertiary)] opacity-50" />
              <span>Tamanho: {material.size}</span>
            </div>
          </div>

          <div className="p-8 flex flex-col gap-8">
            <p className="text-[16px] leading-relaxed text-[var(--color-text-secondary)]">
              {material.description}
            </p>

            <div className="flex flex-col gap-3">
              <a
                href={material.downloadUrl || '#'}
                onClick={!material.downloadUrl ? (e) => e.preventDefault() : undefined}
                className={cn(
                  "w-full inline-flex items-center justify-center rounded-full px-6 py-3.5 text-[16px] font-semibold min-h-[44px] transition-all duration-200 outline-none focus-visible:ring-2",
                  material.downloadUrl
                    ? "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] hover:opacity-90 active:scale-95"
                    : "bg-[var(--color-bg-active)] text-[var(--color-text-tertiary)] cursor-not-allowed opacity-60"
                )}
              >
                {material.downloadUrl ? 'Fazer Download' : 'Em breve'}
              </a>

              <button
                onClick={onClose}
                className="w-full inline-flex items-center justify-center rounded-full px-6 py-3.5 text-[16px] font-semibold bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-active)] active:scale-95 min-h-[44px] transition-all duration-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
