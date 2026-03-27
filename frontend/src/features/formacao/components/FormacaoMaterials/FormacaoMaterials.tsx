import { ScrollReveal } from '../../../../components/motion/ScrollReveal.tsx';
import { MOCK_MATERIALS } from '../../formacao.constants';
import type { Material } from '../../formacao.types';
import { FormacaoMaterialIcon } from '../FormacaoMaterialIcon';

interface FormacaoMaterialsProps {
  showAll: boolean;
  onToggleShowAll: () => void;
  onSelectMaterial: (material: Material) => void;
}

export function FormacaoMaterials({ showAll, onToggleShowAll, onSelectMaterial }: FormacaoMaterialsProps) {
  const materialsList = showAll ? MOCK_MATERIALS : MOCK_MATERIALS.slice(0, 4);

  return (
    <ScrollReveal delay={0.15} className="mt-12 sm:mt-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)]">
            Materiais Extras
          </h3>
          <p className="text-[15px] text-[var(--color-text-secondary)]">
            Templates, planilhas e scripts para aplicar.
          </p>
        </div>

        {MOCK_MATERIALS.length > 4 && (
          <button
            onClick={onToggleShowAll}
            className="text-[14px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors self-start sm:self-auto min-h-[44px] px-2 -ml-2 sm:ml-0"
          >
            {showAll ? 'Mostrar menos' : 'Ver todos'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {materialsList.map((material) => (
          <button
            key={material.id}
            onClick={() => onSelectMaterial(material)}
            className="group flex flex-col md:flex-row md:items-center gap-4 rounded-[20px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-5 text-left transition-all duration-200 hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-elevated)] min-h-[80px] outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <div className="shrink-0 h-12 w-12 rounded-full bg-[var(--color-bg-active)] flex items-center justify-center border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
              <FormacaoMaterialIcon type={material.type} />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-[16px] font-semibold text-[var(--color-text-primary)] tracking-tight truncate">
                {material.title}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-[13px] text-[var(--color-text-tertiary)]">
                <span>{material.type}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--color-text-tertiary)] opacity-50" />
                <span>{material.size}</span>
              </div>
            </div>

            <div className="shrink-0 self-start md:self-center ml-auto">
              <div className="h-8 w-8 rounded-full bg-transparent flex items-center justify-center text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollReveal>
  );
}
