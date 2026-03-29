import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminListKnowledgeDocs,
  adminUploadKnowledgeDoc,
  adminDeleteKnowledgeDoc,
  type KnowledgeDocument,
} from '../services/knowledge.api.ts';

const QUERY_KEY = ['admin-knowledge'] as const;

export function useKnowledge() {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery<KnowledgeDocument[]>({
    queryKey: QUERY_KEY,
    queryFn: adminListKnowledgeDocs,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => adminUploadKnowledgeDoc(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteKnowledgeDoc(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    documents,
    isLoading,
    uploadDoc: (file: File) => uploadMutation.mutate(file),
    isUploading: uploadMutation.isPending,
    deleteDoc: (id: string) => deleteMutation.mutate(id),
    isDeleting: deleteMutation.isPending,
  };
}
