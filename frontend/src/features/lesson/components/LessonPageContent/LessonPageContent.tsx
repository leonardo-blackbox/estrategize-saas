import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { useLessonPage } from '../../hooks/useLessonPage.ts';
import { LessonVideo } from '../LessonVideo/index.ts';
import { LessonContent } from '../LessonContent/index.ts';
import { LessonAttachments } from '../LessonAttachments/index.ts';
import { LessonNavigation } from '../LessonNavigation/index.ts';
import { LessonComments } from '../LessonComments/index.ts';
import { LessonSidebar } from '../LessonSidebar/index.ts';

export function LessonPageContent() {
  const {
    lessonId,
    navigate,
    isLoading,
    isError,
    data,
    lesson,
    course,
    prevLesson,
    nextLesson,
    isLast,
    links,
    ctaButtons,
    readingTimeMins,
    completed,
    handleMarkComplete,
    courseData,
  } = useLessonPage();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-4 w-32 rounded bg-[var(--color-bg-elevated)]" />
        <div className="aspect-video rounded-[20px] bg-[var(--color-bg-elevated)]" />
        <div className="h-8 w-64 rounded bg-[var(--color-bg-elevated)]" />
      </div>
    );
  }

  if (isError || !data || !lesson || !course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-[var(--color-text-secondary)] mb-4">
          Aula nao disponivel ou acesso negado.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-[var(--color-text-primary)] underline text-[14px]"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 lg:pb-12">
      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8">
        {/* Main content */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Breadcrumb */}
          <motion.div variants={staggerItem} className="flex items-center gap-2 mb-6 text-[13px] text-[var(--color-text-tertiary)]">
            <Link to="/formacao" className="hover:text-[var(--color-text-primary)] transition-colors">
              Formacao
            </Link>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <Link to={`/formacao/curso/${course.id}`} className="hover:text-[var(--color-text-primary)] transition-colors truncate max-w-[160px]">
              {course.title}
            </Link>
            <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-[var(--color-text-secondary)] truncate max-w-[160px]">{lesson.title}</span>
          </motion.div>

          <LessonVideo title={lesson.title} videoUrl={lesson.video_url} />

          <LessonContent
            title={lesson.title}
            description={lesson.description}
            durationSecs={lesson.duration_secs}
            readingTimeMins={readingTimeMins}
            completed={completed}
            links={links}
            ctaButtons={ctaButtons}
            onMarkComplete={handleMarkComplete}
          />

          <LessonAttachments attachments={lesson.lesson_attachments} />

          {/* Comments */}
          <motion.div variants={staggerItem} className="mt-10 pt-8 border-t border-[var(--color-border-subtle)]">
            <LessonComments lessonId={lessonId} />
          </motion.div>

          <LessonNavigation
            courseId={course.id}
            prevLesson={prevLesson}
            nextLesson={nextLesson}
            isLast={isLast}
          />
        </motion.div>

        {/* Sidebar -- desktop only */}
        {courseData && (
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <LessonSidebar
                course={courseData.course}
                currentLessonId={lessonId}
                progress={courseData.progress}
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
