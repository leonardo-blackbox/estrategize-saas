import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getLesson, saveProgress } from '../../api/courses.ts';
import { cn } from '../../lib/cn.ts';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';

function formatDuration(secs?: number) {
  if (!secs) return '';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getVideoEmbedUrl(url?: string): string | null {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Retorna como iframe src se já for embed URL
  if (url.includes('embed') || url.includes('player')) return url;

  return null;
}

function FileTypeIcon({ type }: { type?: string }) {
  const t = (type ?? '').toLowerCase();
  if (t.includes('pdf')) return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const watchedSecsRef = useRef(0);
  const [completed, setCompleted] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLesson(lessonId!),
    enabled: !!lessonId,
  });

  const { mutate: saveProgressMutation } = useMutation({
    mutationFn: (d: { watched_secs: number; completed?: boolean }) =>
      saveProgress(lessonId!, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course'] });
    },
  });

  // Inicializar progresso salvo
  useEffect(() => {
    if (data?.progress) {
      watchedSecsRef.current = data.progress.watched_secs;
      setCompleted(data.progress.completed);
    }
  }, [data?.progress]);

  // Auto-save a cada 30s
  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveProgressMutation({ watched_secs: watchedSecsRef.current });
    }, 30_000);
  }, [saveProgressMutation]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const handleMarkComplete = () => {
    setCompleted(true);
    saveProgressMutation({ watched_secs: watchedSecsRef.current, completed: true });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-4 w-32 rounded bg-[var(--color-bg-elevated)]" />
        <div className="aspect-video rounded-[20px] bg-[var(--color-bg-elevated)]" />
        <div className="h-8 w-64 rounded bg-[var(--color-bg-elevated)]" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-[var(--color-text-secondary)] mb-4">
          Aula não disponível ou acesso negado.
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

  const { lesson, progress } = data;
  const module = lesson.modules as any;
  const course = module.courses;
  const embedUrl = getVideoEmbedUrl(lesson.video_url);

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-4xl mx-auto pb-24 lg:pb-12"
    >
      {/* Breadcrumb */}
      <motion.div variants={staggerItem} className="flex items-center gap-2 mb-6 text-[13px] text-[var(--color-text-tertiary)]">
        <Link to="/formacao" className="hover:text-[var(--color-text-primary)] transition-colors">
          Formação
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

      {/* Player */}
      <motion.div variants={staggerItem}>
        <div className="relative rounded-[20px] overflow-hidden bg-black border border-[var(--color-border-subtle)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {embedUrl ? (
            <div className="aspect-video">
              <iframe
                src={embedUrl}
                title={lesson.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="aspect-video flex items-center justify-center bg-[var(--color-bg-elevated)]">
              <div className="text-center">
                <svg className="h-12 w-12 text-[var(--color-text-tertiary)] mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
                </svg>
                <p className="text-[14px] text-[var(--color-text-tertiary)]">Vídeo não disponível</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Lesson header + actions */}
      <motion.div variants={staggerItem} className="mt-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-[var(--color-text-primary)]">
            {lesson.title}
          </h1>
          {lesson.duration_secs && (
            <p className="text-[14px] text-[var(--color-text-tertiary)] mt-1">
              {formatDuration(lesson.duration_secs)}
            </p>
          )}
          {lesson.description && (
            <p className="text-[15px] text-[var(--color-text-secondary)] mt-3 leading-relaxed">
              {lesson.description}
            </p>
          )}
        </div>

        <div className="shrink-0">
          {completed ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-bg-active)] border border-[var(--color-border-subtle)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-text-primary)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Concluída
            </div>
          ) : (
            <button
              onClick={handleMarkComplete}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-text-primary)] px-4 py-2.5 text-[14px] font-semibold text-[var(--color-bg-primary)] hover:opacity-90 active:scale-95 transition-all duration-200 min-h-[44px]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Marcar como concluída
            </button>
          )}
        </div>
      </motion.div>

      {/* Attachments */}
      {lesson.lesson_attachments.length > 0 && (
        <motion.div variants={staggerItem} className="mt-8">
          <h2 className="text-[18px] font-semibold text-[var(--color-text-primary)] mb-4">
            Materiais
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lesson.lesson_attachments.map((att) => (
              <a
                key={att.id}
                href={att.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-4 hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-elevated)] transition-all duration-200 group"
              >
                <div className="shrink-0 w-9 h-9 rounded-full bg-[var(--color-bg-active)] flex items-center justify-center text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                  <FileTypeIcon type={att.file_type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[var(--color-text-primary)] truncate">
                    {att.title}
                  </p>
                  {att.file_size && (
                    <p className="text-[12px] text-[var(--color-text-tertiary)]">
                      {(att.file_size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  )}
                </div>
                <svg className="h-4 w-4 text-[var(--color-text-tertiary)] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </a>
            ))}
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <motion.div variants={staggerItem} className="mt-8 pt-6 border-t border-[var(--color-border-subtle)] flex justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-[14px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors min-h-[44px] px-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Anterior
        </button>
        <Link
          to={`/formacao/curso/${course.id}`}
          className="inline-flex items-center gap-2 text-[14px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors min-h-[44px] px-2"
        >
          Ver todos os módulos
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </motion.div>
    </motion.div>
  );
}
