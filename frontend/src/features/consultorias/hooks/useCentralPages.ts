import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { centralApi, type CentralPageSummary } from '../services/central.api.ts';

export interface CentralTreeNode extends CentralPageSummary {
  children: CentralTreeNode[];
}

export const centralKeys = {
  all: (cid: string) => ['central', cid] as const,
  pages: (cid: string) => ['central', cid, 'pages'] as const,
  page: (cid: string, pid: string) => ['central', cid, 'page', pid] as const,
  templates: (cid: string) => ['central', cid, 'templates'] as const,
};

function toTree(pages: CentralPageSummary[]): CentralTreeNode[] {
  const byId = new Map<string, CentralTreeNode>();
  pages.forEach((p) => byId.set(p.id, { ...p, children: [] }));
  const roots: CentralTreeNode[] = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortRec = (nodes: CentralTreeNode[]) => {
    nodes.sort((a, b) => a.position - b.position);
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

export function useCentralPages(consultancyId: string) {
  const query = useQuery({
    queryKey: centralKeys.pages(consultancyId),
    queryFn: () => centralApi.list(consultancyId),
    enabled: !!consultancyId,
    staleTime: 30_000,
  });

  const tree = useMemo(() => toTree(query.data ?? []), [query.data]);
  const flat = query.data ?? [];

  return {
    pages: flat,
    tree,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
