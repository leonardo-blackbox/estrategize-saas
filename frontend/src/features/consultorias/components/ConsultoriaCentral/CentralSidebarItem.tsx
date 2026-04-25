import { useState } from 'react';
import { cn } from '../../../../lib/cn.ts';
import type { CentralTreeNode } from '../../hooks/useCentralPages.ts';

interface Props {
  node: CentralTreeNode;
  activeId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
  depth?: number;
}

export function CentralSidebarItem({
  node, activeId, onSelect, onAddChild, onDelete, depth = 0,
}: Props) {
  const [open, setOpen] = useState(true);
  const [hover, setHover] = useState(false);
  const hasChildren = node.children.length > 0;
  const isActive = activeId === node.id;

  return (
    <div>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={cn(
          'group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer',
          'transition-colors duration-150',
          isActive
            ? 'bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--text-primary)]'
            : 'hover:bg-[color-mix(in_srgb,white_5%,transparent)] text-[var(--text-secondary)]',
        )}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => onSelect(node.id)}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (hasChildren) setOpen((o) => !o); }}
          className={cn(
            'w-4 h-4 flex items-center justify-center shrink-0 cursor-pointer',
            'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
            !hasChildren && 'opacity-30',
          )}
        >
          {hasChildren ? (
            <svg className={cn('w-3 h-3 transition-transform', open && 'rotate-90')} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          ) : (
            <span className="w-1 h-1 rounded-full bg-current" />
          )}
        </button>

        <span className="text-[13px] mr-1 shrink-0">{node.emoji ?? '📄'}</span>
        <span className="text-[13px] truncate flex-1">{node.title}</span>

        {hover && (
          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onAddChild(node.id)}
              title="Adicionar subpágina"
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-[color-mix(in_srgb,white_8%,transparent)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => { if (confirm(`Excluir "${node.title}" e suas subpáginas?`)) onDelete(node.id); }}
              title="Excluir"
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <CentralSidebarItem
              key={child.id}
              node={child}
              activeId={activeId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
