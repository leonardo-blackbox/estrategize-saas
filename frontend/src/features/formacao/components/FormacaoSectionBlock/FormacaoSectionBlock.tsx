import { motion } from 'framer-motion';
import type { CourseCardData } from '../../formacao.types';
import { FormacaoCourseCard, CourseCardSkeleton } from '../FormacaoCourseCard';

interface FormacaoSectionBlockProps {
  title: string;
  courses: CourseCardData[];
  loading: boolean;
}

export function FormacaoSectionBlock({ title, courses, loading }: FormacaoSectionBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mt-12 sm:mt-16 -mx-5 sm:mx-0"
    >
      <div className="px-5 sm:px-0 mb-6">
        <h3 className="text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)]">
          {title}
        </h3>
      </div>

      <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory px-5 sm:px-0 pb-4 sm:pb-0 scrollbar-none">
        {loading
          ? [1, 2, 3].map((i) => <CourseCardSkeleton key={i} />)
          : courses.length === 0
            ? (
              <div className="col-span-3 py-12 text-center">
                <p className="text-[15px] text-[var(--color-text-tertiary)]">
                  Nenhum curso dispon\u00edvel no momento.
                </p>
              </div>
            )
            : courses.map((course) => <FormacaoCourseCard key={course.id} course={course} />)
        }
      </div>
    </motion.div>
  );
}
