import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staggerItem } from '../../../../lib/motion.ts';
import { cn } from '../../../../lib/cn.ts';
import type { TabId } from '../../hooks/useAdminUserDetail.ts';
import { TABS } from '../../hooks/useAdminUserDetail.ts';

interface AdminUserDetailHeaderProps {
  displayName: string;
  email: string;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export function AdminUserDetailHeader({
  displayName, email, activeTab, setActiveTab,
}: AdminUserDetailHeaderProps) {
  return (
    <>
      {/* Breadcrumb */}
      <motion.div variants={staggerItem} className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
        <Link to="/admin/usuarios" className="hover:text-[var(--text-secondary)] transition-colors">
          ← Usuarios
        </Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] truncate max-w-[200px]">{displayName}</span>
      </motion.div>

      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-base font-semibold text-[var(--text-primary)]">{displayName}</h1>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{email}</p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-1 border-b border-[var(--border-hairline)] overflow-x-auto scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                  : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
}
