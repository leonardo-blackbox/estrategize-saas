import { useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCourse } from '../../../api/courses.ts';

export function useCoursePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // null = user hasn't toggled yet; derive from data
  const [userToggledModules, setUserToggledModules] = useState<Set<string> | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['course', id],
    queryFn: () => getCourse(id!),
    enabled: !!id,
  });

  const firstModuleId = data?.course.modules?.[0]?.id;

  // Derive open modules: user overrides if they've interacted, else first module
  const openModules = useMemo(() => {
    if (userToggledModules !== null) return userToggledModules;
    if (firstModuleId) return new Set([firstModuleId]);
    return new Set<string>();
  }, [userToggledModules, firstModuleId]);

  const toggleModule = useCallback((moduleId: string) => {
    setUserToggledModules((prev) => {
      // On first interaction, seed from derived default
      const current = prev ?? (firstModuleId ? new Set([firstModuleId]) : new Set<string>());
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }, [firstModuleId]);

  // Derived data
  const course = data?.course;
  const access = data?.access;
  const progress = data?.progress ?? {};

  const allLessons = course?.modules.flatMap((m) => m.lessons) ?? [];
  const completedCount = allLessons.filter((l) => progress[l.id]?.completed).length;
  const progressPct = allLessons.length > 0
    ? (completedCount / allLessons.length) * 100
    : 0;
  const nextLesson = allLessons.find((l) => !progress[l.id]?.completed);

  return {
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
  };
}
