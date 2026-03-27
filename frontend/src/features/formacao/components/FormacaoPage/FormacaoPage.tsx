import { motion, useReducedMotion } from 'framer-motion';
import { staggerContainer } from '../../../../lib/motion.ts';
import { useFormacao } from '../../hooks/useFormacao';
import { FormacaoHero } from '../FormacaoHero';
import { FormacaoSectionBlock } from '../FormacaoSectionBlock';
import { FormacaoJourney } from '../FormacaoJourney';
import { FormacaoMaterials } from '../FormacaoMaterials';
import { FormacaoMaterialModal } from '../FormacaoMaterialModal';

export function FormacaoPage() {
  const prefersReducedMotion = useReducedMotion();
  const {
    homeSettings,
    courses,
    sectionsCourses,
    hasSections,
    sectionsLoading,
    catalogLoading,
    continueLearning,
    showAllMaterials,
    setShowAllMaterials,
    selectedMaterial,
    setSelectedMaterial,
  } = useFormacao();

  const containerVariants = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : staggerContainer;

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="w-full max-w-5xl mx-auto pb-24 lg:pb-12"
      >
        <div className={homeSettings?.subtitle ? 'mb-4 sm:mb-6' : 'mb-8 sm:mb-12'}>
          <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-tight text-[var(--color-text-primary)]">
            {homeSettings?.title ?? 'Forma\u00e7\u00e3o'}
          </h1>
          {homeSettings?.subtitle && (
            <p className="text-[17px] text-[var(--color-text-secondary)] mt-2">
              {homeSettings.subtitle}
            </p>
          )}
        </div>

        {continueLearning && <FormacaoHero data={continueLearning} />}

        {sectionsLoading ? (
          <FormacaoSectionBlock title="Seus Cursos" courses={[]} loading={true} />
        ) : hasSections ? (
          sectionsCourses.map((section) => (
            <FormacaoSectionBlock
              key={section.id}
              title={section.title}
              courses={section.courses}
              loading={false}
            />
          ))
        ) : (
          <FormacaoSectionBlock
            title="Seus Cursos"
            courses={courses}
            loading={catalogLoading}
          />
        )}

        <FormacaoJourney />

        <FormacaoMaterials
          showAll={showAllMaterials}
          onToggleShowAll={() => setShowAllMaterials(!showAllMaterials)}
          onSelectMaterial={setSelectedMaterial}
        />
      </motion.div>

      <FormacaoMaterialModal
        material={selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
      />
    </>
  );
}
