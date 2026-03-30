import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listConsultancyDocs,
  uploadConsultancyDoc,
  deleteConsultancyDoc,
  type KnowledgeDocument,
} from '../services/consultancyDocuments.api.ts';

function queryKey(consultancyId: string) {
  return ['consultancy-documents', consultancyId] as const;
}

export function useConsultancyDocuments(consultancyId: string) {
  const qc = useQueryClient();
  const key = queryKey(consultancyId);

  const { data: documents = [], isLoading } = useQuery<KnowledgeDocument[]>({
    queryKey: key,
    queryFn: () => listConsultancyDocs(consultancyId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadConsultancyDoc(consultancyId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => deleteConsultancyDoc(consultancyId, docId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    documents,
    isLoading,
    uploadDoc: (file: File) => uploadMutation.mutate(file),
    isUploading: uploadMutation.isPending,
    deleteDoc: (docId: string) => deleteMutation.mutate(docId),
    isDeleting: deleteMutation.isPending,
  };
}
