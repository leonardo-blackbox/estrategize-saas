import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { useAdminUserDetail } from '../../hooks/useAdminUserDetail.ts';
import { AdminUserDetailHeader } from '../AdminUserDetailHeader/index.ts';
import { AdminUserDetailTabOverview } from '../AdminUserDetailTabOverview/index.ts';
import { AdminUserDetailTabCourses } from '../AdminUserDetailTabCourses/index.ts';
import { AdminUserDetailTabCredits } from '../AdminUserDetailTabCredits/index.ts';
import { AdminUserDetailTabHistory } from '../AdminUserDetailTabHistory/index.ts';

export function AdminUserDetailPage() {
  const u = useAdminUserDetail();

  if (u.isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-4 w-32 rounded bg-[var(--bg-surface-1)]" />
        <div className="h-8 w-64 rounded bg-[var(--bg-surface-1)]" />
        <div className="h-10 rounded bg-[var(--bg-surface-1)]" />
        <div className="h-48 rounded bg-[var(--bg-surface-1)]" />
      </div>
    );
  }

  if (u.error || !u.detail) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link to="/admin/usuarios" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
          ← Usuarios
        </Link>
        <div className="mt-8 text-center">
          <p className="text-sm text-red-500">Usuario nao encontrado.</p>
          <Button className="mt-4" onClick={() => u.navigate('/admin/usuarios')}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-4xl mx-auto space-y-6"
    >
      <AdminUserDetailHeader
        displayName={u.displayName}
        email={u.detail.authUser?.email}
        activeTab={u.activeTab}
        setActiveTab={u.setActiveTab}
      />

      <motion.div variants={staggerItem}>
        {u.activeTab === 'overview' && (
          <AdminUserDetailTabOverview detail={u.detail} userId={u.id!} onProfileUpdated={u.invalidateUsers} />
        )}
        {u.activeTab === 'courses' && (
          <AdminUserDetailTabCourses detail={u.detail} userId={u.id!} />
        )}
        {u.activeTab === 'credits' && (
          <AdminUserDetailTabCredits userId={u.id!} />
        )}
        {u.activeTab === 'history' && (
          <AdminUserDetailTabHistory userId={u.id!} />
        )}
      </motion.div>
    </motion.div>
  );
}
