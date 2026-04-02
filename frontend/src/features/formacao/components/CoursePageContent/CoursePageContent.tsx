import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { useCoursePage } from '../../hooks/useCoursePage.ts';
import { CourseHero } from '../CourseHero/index.ts';
import { CourseModuleList } from '../CourseModuleList/index.ts';

export function CoursePageContent() {
  const {
    navigate,
    isLoading,
    isError,
    data,
    course,
    access,
    progress,
    allLessons,
    completedCount,
    progressPct,
    nextLesson,
    openModules,
    toggleModule,
  } = useCoursePage();

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-64 rounded-[24px] bg-[var(--color-bg-elevated)]" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-[16px] bg-[var(--color-bg-elevated)]" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data || !course || !access) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-[var(--color-text-secondary)]">Curso nao encontrado.</p>
        <Link to="/formacao" className="mt-4 inline-block text-[var(--color-text-primary)] underline">
          Voltar a Formacao
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto pb-24 lg:pb-12"
    >
      {/* Back */}
      <motion.div variants={staggerItem} className="mb-6">
        <Link
          to="/formacao"
          className="inline-flex items-center gap-2 text-[14px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Formacao
        </Link>
      </motion.div>

      <CourseHero
        title={course.title}
        description={course.description}
        bannerUrl={course.banner_url}
        coverUrl={course.cover_url}
        progressPct={progressPct}
        completedCount={completedCount}
        totalLessons={allLessons.length}
        nextLessonId={nextLesson?.id}
        accessAllowed={access.allowed}
        onContinue={() => nextLesson && navigate(`/formacao/aula/${nextLesson.id}`)}
      />

      <CourseModuleList
        modules={course.modules}
        progress={progress}
        access={access}
        openModules={openModules}
        onToggleModule={toggleModule}
      />
    </motion.div>
  );
}
