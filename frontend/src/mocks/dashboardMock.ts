export interface ActiveConsultancy {
  id: string;
  title: string;
  client: string;
  status: 'in_progress' | 'pending_review' | 'completed';
  progress: number;
  updatedAt: string;
}

export interface NextAction {
  id: string;
  title: string;
  consultancy: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

export interface RecommendedTool {
  id: string;
  name: string;
  description: string;
  category: string;
  creditCost: number;
}

export interface RecentActivity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'consultancy' | 'diagnosis' | 'tool' | 'course';
}

export interface RecommendedCourse {
  id: string;
  title: string;
  instructor: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface LockedResource {
  id: string;
  name: string;
  description: string;
  requiredPlan: string;
}

export interface CreditStatus {
  available: number;
  used: number;
  total: number;
  planName: string;
  renewalDate: string;
}

export const mockActiveConsultancies: ActiveConsultancy[] = [
  {
    id: '1',
    title: 'Digital Transformation Strategy',
    client: 'TechCorp Inc.',
    status: 'in_progress',
    progress: 65,
    updatedAt: '2 hours ago',
  },
  {
    id: '2',
    title: 'Market Expansion Analysis',
    client: 'GrowthCo',
    status: 'pending_review',
    progress: 90,
    updatedAt: '1 day ago',
  },
  {
    id: '3',
    title: 'Operational Efficiency Audit',
    client: 'BuildRight LLC',
    status: 'in_progress',
    progress: 30,
    updatedAt: '3 hours ago',
  },
  {
    id: '4',
    title: 'Brand Repositioning Plan',
    client: 'FreshStart Co.',
    status: 'completed',
    progress: 100,
    updatedAt: '5 days ago',
  },
];

export const mockNextActions: NextAction[] = [
  {
    id: '1',
    title: 'Review diagnostic report for TechCorp',
    consultancy: 'Digital Transformation Strategy',
    dueDate: 'Today',
    priority: 'high',
  },
  {
    id: '2',
    title: 'Schedule follow-up meeting with GrowthCo',
    consultancy: 'Market Expansion Analysis',
    dueDate: 'Tomorrow',
    priority: 'medium',
  },
  {
    id: '3',
    title: 'Complete SWOT analysis for BuildRight',
    consultancy: 'Operational Efficiency Audit',
    dueDate: 'In 3 days',
    priority: 'medium',
  },
  {
    id: '4',
    title: 'Send final presentation to FreshStart',
    consultancy: 'Brand Repositioning Plan',
    dueDate: 'In 5 days',
    priority: 'low',
  },
];

export const mockRecommendedTools: RecommendedTool[] = [
  {
    id: '1',
    name: 'SWOT Generator',
    description: 'AI-powered SWOT analysis for your consultancy',
    category: 'Analysis',
    creditCost: 5,
  },
  {
    id: '2',
    name: 'Market Scanner',
    description: 'Scan market trends and competitor landscape',
    category: 'Research',
    creditCost: 10,
  },
  {
    id: '3',
    name: 'Action Plan Builder',
    description: 'Create structured action plans with milestones',
    category: 'Planning',
    creditCost: 3,
  },
  {
    id: '4',
    name: 'Risk Matrix',
    description: 'Evaluate and prioritize business risks',
    category: 'Analysis',
    creditCost: 5,
  },
];

export const mockRecentActivities: RecentActivity[] = [
  {
    id: '1',
    title: 'Edited diagnostic report',
    description: 'Digital Transformation Strategy — TechCorp Inc.',
    timestamp: '2 hours ago',
    type: 'diagnosis',
  },
  {
    id: '2',
    title: 'Created new consultancy',
    description: 'Operational Efficiency Audit — BuildRight LLC',
    timestamp: '5 hours ago',
    type: 'consultancy',
  },
  {
    id: '3',
    title: 'Used SWOT Generator',
    description: 'Market Expansion Analysis — GrowthCo',
    timestamp: '1 day ago',
    type: 'tool',
  },
];

export const mockRecommendedCourses: RecommendedCourse[] = [
  {
    id: '1',
    title: 'Strategic Consulting Fundamentals',
    instructor: 'Dr. Ana Martins',
    duration: '4h 30min',
    level: 'beginner',
  },
  {
    id: '2',
    title: 'Advanced Diagnostic Methods',
    instructor: 'Prof. Carlos Silva',
    duration: '6h 15min',
    level: 'advanced',
  },
  {
    id: '3',
    title: 'Client Relationship Management',
    instructor: 'Maria Souza',
    duration: '3h 45min',
    level: 'intermediate',
  },
  {
    id: '4',
    title: 'Data-Driven Strategy',
    instructor: 'Dr. Pedro Alves',
    duration: '5h 00min',
    level: 'intermediate',
  },
];

export const mockLockedResources: LockedResource[] = [
  {
    id: '1',
    name: 'AI Competitive Intelligence',
    description: 'Real-time competitor monitoring powered by AI',
    requiredPlan: 'Professional',
  },
  {
    id: '2',
    name: 'White-Label Reports',
    description: 'Generate branded PDF reports for clients',
    requiredPlan: 'Professional',
  },
  {
    id: '3',
    name: 'Team Collaboration',
    description: 'Invite team members and collaborate on consultancies',
    requiredPlan: 'Enterprise',
  },
];

export const mockCreditStatus: CreditStatus = {
  available: 42,
  used: 58,
  total: 100,
  planName: 'Starter',
  renewalDate: 'Mar 15, 2026',
};
