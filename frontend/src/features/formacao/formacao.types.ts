export type CourseStatus = 'active' | 'locked' | 'drip' | 'expiring' | 'completed';

export interface CourseCardData {
  id: string;
  title: string;
  lessons: number;
  status: CourseStatus;
  thumbnail: string | null;
  requiredOffer?: string;
  dripDate?: string;
  expiryDate?: string;
  salesUrl?: string | null;
  offerBadgeText?: string | null;
}

export interface ContinueLearningData {
  courseId: string;
  lessonId: string;
  title: string;
  module: string;
  lesson: string;
  progress: number;
  thumbnail: string | null;
}

export type MaterialType = 'PDF' | 'Template' | 'Imagem';

export interface Material {
  id: string;
  title: string;
  type: MaterialType;
  description: string;
  uploadedAt: string;
  size: string;
  downloadUrl?: string;
}

export interface JourneyStep {
  id: string;
  step: string;
  title: string;
  description: string;
  recommended: boolean;
  cta: string;
}
