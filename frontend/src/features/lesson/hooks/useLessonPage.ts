import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLesson, getCourse, saveProgress } from '../../../api/courses.ts';

export function useLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const watchedSecsRef = useRef(0);
  // Optimistic local override: null = use server value
  const [completedOverride, setCompletedOverride] = useState<boolean | null>(null);

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

  // Fetch course for sidebar
  const courseId = data?.lesson
    ? (data.lesson.modules as Record<string, unknown>).courses as { id: string } | undefined
    : undefined;
  const resolvedCourseId = courseId?.id;

  const { data: courseData } = useQuery({
    queryKey: ['course', resolvedCourseId],
    queryFn: () => getCourse(resolvedCourseId!),
    enabled: !!resolvedCourseId,
  });

  // Derive completed: optimistic override wins, else server value
  const completed = completedOverride ?? data?.progress?.completed ?? false;

  // Sync watched secs ref from server data
  useEffect(() => {
    if (data?.progress) {
      watchedSecsRef.current = data.progress.watched_secs;
    }
  }, [data?.progress]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const handleMarkComplete = () => {
    setCompletedOverride(true);
    saveProgressMutation({
      watched_secs: watchedSecsRef.current,
      completed: true,
    });
  };

  // Derived data
  const lesson = data?.lesson;
  const module = lesson?.modules as Record<string, unknown> | undefined;
  const course = module?.courses as { id: string; title: string } | undefined;
  const prevLesson = data?.prevLesson ?? null;
  const nextLesson = data?.nextLesson ?? null;
  const isLast = data?.isLast ?? false;

  const lessonLinks = lesson?.lesson_links ?? [];
  const links = lessonLinks.filter((l) => l.type === 'link');
  const ctaButtons = lessonLinks.filter((l) => l.type === 'button');

  const readingTimeMins = lesson?.description
    ? Math.max(1, Math.round(lesson.description.split(/\s+/).length / 200))
    : 0;

  return {
    lessonId: lessonId!,
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
  };
}
