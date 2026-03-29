import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminGetCourse,
  adminUpdateCourse,
  adminCreateModule,
  adminUpdateModule,
  adminDeleteModule,
  adminCreateLesson,
  adminUpdateLesson,
  adminDeleteLesson,
  adminPublishLesson,
  adminUnpublishLesson,
} from '../services/admin.api.ts';
import type { LessonLink } from '../services/admin.api.ts';

const emptyModule = { title: '', description: '', drip_days: '' };
const emptyLesson = {
  title: '', description: '', video_url: '', duration_secs: '', drip_days: '', is_free_preview: false,
};

export function useAdminCursoDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'content' | 'sales'>('content');

  // Modal states
  const [editingCourse, setEditingCourse] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<any | null>(null);
  const [confirmDeleteModule, setConfirmDeleteModule] = useState<string | null>(null);
  const [showLessonModal, setShowLessonModal] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [confirmDeleteLesson, setConfirmDeleteLesson] = useState<string | null>(null);
  const [linksLesson, setLinksLesson] = useState<{ id: string; title: string; links: LessonLink[] } | null>(null);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  // Forms
  const [courseForm, setCourseForm] = useState({ title: '', description: '', cover_url: '', banner_url: '' });
  const [moduleForm, setModuleForm] = useState(emptyModule);
  const [editModuleForm, setEditModuleForm] = useState(emptyModule);
  const [lessonForm, setLessonForm] = useState(emptyLesson);
  const [editLessonForm, setEditLessonForm] = useState(emptyLesson);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-course', id],
    queryFn: () => adminGetCourse(id!),
    enabled: !!id,
  });

  const course = data as any;

  const invalidateCourse = () => {
    qc.invalidateQueries({ queryKey: ['admin-course', id] });
    qc.invalidateQueries({ queryKey: ['admin-courses'] });
  };

  const updateCourseMutation = useMutation({
    mutationFn: (d: any) => adminUpdateCourse(id!, d),
    onSuccess: () => { invalidateCourse(); setEditingCourse(false); },
  });

  const createModuleMutation = useMutation({
    mutationFn: (d: any) => adminCreateModule(id!, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
      setShowModuleModal(false);
      setModuleForm(emptyModule);
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ mid, d }: { mid: string; d: any }) => adminUpdateModule(mid, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
      setEditingModule(null);
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: adminDeleteModule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
      setConfirmDeleteModule(null);
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: ({ moduleId, d }: { moduleId: string; d: any }) => adminCreateLesson(moduleId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
      setShowLessonModal(null);
      setLessonForm(emptyLesson);
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: ({ lid, d }: { lid: string; d: any }) => adminUpdateLesson(lid, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
      setEditingLesson(null);
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: adminDeleteLesson,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
      setConfirmDeleteLesson(null);
    },
  });

  const publishLessonMutation = useMutation({
    mutationFn: adminPublishLesson,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-course', id] }),
  });

  const unpublishLessonMutation = useMutation({
    mutationFn: adminUnpublishLesson,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-course', id] }),
  });

  const openEditCourse = () => {
    setCourseForm({
      title: course?.title ?? '',
      description: course?.description ?? '',
      cover_url: course?.cover_url ?? '',
      banner_url: course?.banner_url ?? '',
    });
    setEditingCourse(true);
  };

  const openEditModule = (mod: any) => {
    setEditingModule(mod);
    setEditModuleForm({ title: mod.title, description: mod.description ?? '', drip_days: mod.drip_days?.toString() ?? '0' });
  };

  const openEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
    setEditLessonForm({
      title: lesson.title,
      description: lesson.description ?? '',
      video_url: lesson.video_url ?? '',
      duration_secs: lesson.duration_secs?.toString() ?? '',
      drip_days: lesson.drip_days?.toString() ?? '0',
      is_free_preview: lesson.is_free_preview ?? false,
    });
  };

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  return {
    id, course, isLoading, isError,
    activeTab, setActiveTab,
    // Course editing
    editingCourse, setEditingCourse, courseForm, setCourseForm,
    openEditCourse, updateCourseMutation,
    // Modules
    showModuleModal, setShowModuleModal, moduleForm, setModuleForm,
    editingModule, setEditingModule, editModuleForm, setEditModuleForm,
    confirmDeleteModule, setConfirmDeleteModule,
    createModuleMutation, updateModuleMutation, deleteModuleMutation,
    openEditModule, openModules, toggleModule,
    // Lessons
    showLessonModal, setShowLessonModal, lessonForm, setLessonForm,
    editingLesson, setEditingLesson, editLessonForm, setEditLessonForm,
    confirmDeleteLesson, setConfirmDeleteLesson,
    createLessonMutation, updateLessonMutation, deleteLessonMutation,
    publishLessonMutation, unpublishLessonMutation,
    openEditLesson, linksLesson, setLinksLesson,
  };
}
