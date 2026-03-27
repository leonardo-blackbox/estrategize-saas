import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isDaysUrgent } from '../../../lib/dates.ts';
import {
  getCatalog,
  getContinueWatching,
  getFormacaoSections,
  getHomeSettings,
  type CatalogCourse,
  type ContinueWatchingItem,
  type FormationSection,
} from '../services/formacao.api';
import type { CourseCardData, CourseStatus, ContinueLearningData, Material } from '../formacao.types';

// --- Data Mappers ---

function mapCatalogToCard(course: CatalogCourse): CourseCardData {
  const { access } = course;
  let status: CourseStatus = 'active';

  if (!access.allowed) {
    if (access.reason === 'drip_locked') {
      status = 'drip';
    } else {
      status = 'locked';
    }
  } else if (access.expiresAt && isDaysUrgent(access.expiresAt)) {
    status = 'expiring';
  }

  return {
    id: course.id,
    title: course.title,
    lessons: course.total_lessons,
    status,
    thumbnail: course.cover_url ?? null,
    requiredOffer: status === 'locked' ? 'Plano superior' : undefined,
    dripDate: access.unlocksAt ? new Date(access.unlocksAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : undefined,
    expiryDate: access.expiresAt ? new Date(access.expiresAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : undefined,
    salesUrl: course.sales_url ?? null,
    offerBadgeText: course.offer_badge_enabled ? (course.offer_badge_text ?? null) : null,
  };
}

function mapContinueWatching(items: ContinueWatchingItem[]): ContinueLearningData | null {
  if (!items.length) return null;
  const item = items[0];
  const { lessons: lesson } = item;
  if (!lesson?.modules?.courses) return null;
  const course = lesson.modules.courses;
  const pct = lesson.duration_secs && item.watched_secs
    ? Math.min(Math.round((item.watched_secs / lesson.duration_secs) * 100), 99)
    : 0;

  return {
    courseId: course.id,
    lessonId: lesson.id,
    title: course.title,
    module: lesson.modules.title,
    lesson: lesson.title,
    progress: pct,
    thumbnail: course.cover_url ?? null,
  };
}

// --- Hook ---

export function useFormacao() {
  const [showAllMaterials, setShowAllMaterials] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const { data: homeSettings } = useQuery({
    queryKey: ['home-settings'],
    queryFn: getHomeSettings,
    staleTime: 10 * 60 * 1000,
  });

  const { data: catalogRaw = [], isLoading: catalogLoading } = useQuery({
    queryKey: ['catalog'],
    queryFn: getCatalog,
  });

  const { data: sectionsRaw = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['formacao-sections'],
    queryFn: getFormacaoSections,
  });

  const { data: continueWatchingRaw = [] } = useQuery({
    queryKey: ['continue-watching'],
    queryFn: getContinueWatching,
  });

  const courses = catalogRaw.map(mapCatalogToCard);
  const sectionsData = sectionsRaw as FormationSection[];
  const hasSections = sectionsData.length > 0;
  const continueLearning = mapContinueWatching(continueWatchingRaw);

  const sectionsCourses = sectionsData.map((section) => ({
    ...section,
    courses: section.courses.map(mapCatalogToCard),
  }));

  return {
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
  };
}
