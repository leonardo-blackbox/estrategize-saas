import { motion } from 'framer-motion';
import { staggerItem } from '../../../../lib/motion.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { AdminHomeSectionRow } from '../AdminHomeSectionRow/index.ts';

interface AdminHomeSectionsProps {
  sectionList: any[];
  sectionsLoading: boolean;
  editingId: string | null;
  editTitle: string;
  setEditTitle: (v: string) => void;
  setEditingId: (v: string | null) => void;
  openStatusDropdown: string | null;
  setOpenStatusDropdown: (v: string | null) => void;
  updateMutation: { mutate: (v: any) => void; isPending: boolean };
  reorderPending: boolean;
  moveSection: (index: number, direction: 'up' | 'down') => void;
  onCreateClick: () => void;
  onManageSection: (section: any) => void;
  onDeleteSection: (id: string) => void;
}

export function AdminHomeSections({
  sectionList, sectionsLoading,
  editingId, editTitle, setEditTitle, setEditingId,
  openStatusDropdown, setOpenStatusDropdown,
  updateMutation, reorderPending,
  moveSection, onCreateClick, onManageSection, onDeleteSection,
}: AdminHomeSectionsProps) {
  return (
    <motion.div variants={staggerItem} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Secoes</h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Organize as secoes exibidas na area de membros.
          </p>
        </div>
        <Button size="sm" onClick={onCreateClick}>+ Nova secao</Button>
      </div>

      <div className="space-y-2">
        {sectionsLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />
          ))
        ) : sectionList.length === 0 ? (
          <div className="rounded-[var(--radius-md)] p-10 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center">
            <p className="text-sm text-[var(--text-tertiary)]">Nenhuma secao criada ainda.</p>
          </div>
        ) : (
          sectionList.map((section: any, index: number) => (
            <AdminHomeSectionRow
              key={section.id}
              section={section}
              index={index}
              totalCount={sectionList.length}
              editingId={editingId}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              setEditingId={setEditingId}
              openStatusDropdown={openStatusDropdown}
              setOpenStatusDropdown={setOpenStatusDropdown}
              updateMutation={updateMutation}
              reorderPending={reorderPending}
              onMoveUp={() => moveSection(index, 'up')}
              onMoveDown={() => moveSection(index, 'down')}
              onManage={() => onManageSection(section)}
              onDelete={() => onDeleteSection(section.id)}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
