export interface KnowledgeDocument {
  id: string;
  name: string;
  scope: 'global' | 'consultancy';
  status: 'processing' | 'ready' | 'error';
  chunk_count: number;
  created_at: string;
}

export interface KnowledgeTestResult {
  answer: string;
  sources: string[];
}
