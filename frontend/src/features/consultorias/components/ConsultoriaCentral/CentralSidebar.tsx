import type { CentralTreeNode } from '../../hooks/useCentralPages.ts';
import { CentralSidebarItem } from './CentralSidebarItem.tsx';

interface Props {
  tree: CentralTreeNode[];
  activeId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onAddRoot: () => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
}

export function CentralSidebar({
  tree, activeId, isLoading, onSelect, onAddRoot, onAddChild, onDelete,
}: Props) {
  return (
    <aside className="consult-glass p-3 h-fit sticky top-[140px] space-y-1.5">
      <div className="flex items-center justify-between px-2 pt-1 pb-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          Páginas
        </h3>
        <button
          type="button"
          onClick={onAddRoot}
          title="Nova página"
          className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] cursor-pointer transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-1.5 px-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-7 rounded-lg bg-[color-mix(in_srgb,white_4%,transparent)] animate-pulse" />
          ))}
        </div>
      ) : tree.length === 0 ? (
        <div className="px-2 py-3 text-[12px] text-[var(--text-tertiary)] italic">
          Nenhuma página ainda.
        </div>
      ) : (
        <div className="space-y-0.5 max-h-[calc(100vh-280px)] overflow-y-auto">
          {tree.map((node) => (
            <CentralSidebarItem
              key={node.id}
              node={node}
              activeId={activeId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
