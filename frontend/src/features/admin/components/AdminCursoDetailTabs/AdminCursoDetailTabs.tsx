import { motion } from 'framer-motion';
import { staggerItem } from '../../../../lib/motion.ts';
import { cn } from '../../../../lib/cn.ts';

interface AdminCursoDetailTabsProps {
  activeTab: 'content' | 'sales';
  setActiveTab: (tab: 'content' | 'sales') => void;
}

export function AdminCursoDetailTabs({ activeTab, setActiveTab }: AdminCursoDetailTabsProps) {
  return (
    <motion.div variants={staggerItem}>
      <div className="flex items-center gap-1 border-b border-[var(--border-hairline)]">
        {(['content', 'sales'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab
                ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
            )}
          >
            {tab === 'content' ? 'Conteudo' : 'Vendas'}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
