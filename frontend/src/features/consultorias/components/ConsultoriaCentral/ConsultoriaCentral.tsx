import { useEffect, useState } from 'react';
import { useCentralPages } from '../../hooks/useCentralPages.ts';
import { useCentralMutations } from '../../hooks/useCentralMutations.ts';
import { CentralSidebar } from './CentralSidebar.tsx';
import { CentralPageView } from './CentralPageView.tsx';
import { CentralEmptyState } from './CentralEmptyState.tsx';

interface Props {
  consultancyId: string;
}

export function ConsultoriaCentral({ consultancyId }: Props) {
  const { tree, pages, isLoading } = useCentralPages(consultancyId);
  const { create, remove } = useCentralMutations(consultancyId);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Auto-select first page when none selected
  useEffect(() => {
    if (!activeId && pages.length > 0) {
      setActiveId(pages[0].id);
    }
    if (activeId && !pages.find((p) => p.id === activeId)) {
      setActiveId(pages[0]?.id ?? null);
    }
  }, [pages, activeId]);

  const handleAddRoot = async () => {
    const page = await create.mutateAsync({ title: 'Sem título', emoji: '📄' });
    setActiveId(page.id);
  };

  const handleAddChild = async (parentId: string) => {
    const page = await create.mutateAsync({ title: 'Sem título', emoji: '📄', parent_id: parentId });
    setActiveId(page.id);
  };

  const handleDelete = async (id: string) => {
    await remove.mutateAsync(id);
    if (activeId === id) setActiveId(null);
  };

  // Empty state — no pages at all
  if (!isLoading && pages.length === 0) {
    return (
      <div className="py-4">
        <CentralEmptyState consultancyId={consultancyId} onPageCreated={setActiveId} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 items-start">
      <CentralSidebar
        tree={tree}
        activeId={activeId}
        isLoading={isLoading}
        onSelect={setActiveId}
        onAddRoot={handleAddRoot}
        onAddChild={handleAddChild}
        onDelete={handleDelete}
      />

      {activeId ? (
        <CentralPageView consultancyId={consultancyId} pageId={activeId} />
      ) : (
        <div className="consult-glass p-12 text-center">
          <p className="text-[14px] text-[var(--text-tertiary)]">
            Selecione uma página na barra lateral.
          </p>
        </div>
      )}
    </div>
  );
}
