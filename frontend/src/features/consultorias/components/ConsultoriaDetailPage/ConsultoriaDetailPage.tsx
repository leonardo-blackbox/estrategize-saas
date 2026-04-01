import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { useConsultoriaDetail } from '../../hooks/useConsultoriaDetail.ts';
import { ConsultoriaDetailSkeleton } from '../ConsultoriaDetailSkeleton';
import { ConsultoriaDetailHeader } from '../ConsultoriaDetailHeader';
import { ConsultoriaDetailInsights } from '../ConsultoriaDetailInsights';
import { ConsultoriaDetailTabs } from '../ConsultoriaDetailTabs';
import { ConsultoriaDetailOverview } from '../ConsultoriaDetailOverview';
import { ConsultoriaDetailDados } from '../ConsultoriaDetailDados';
import { ConsultoriaDetailDiagnosis } from '../ConsultoriaDetailDiagnosis';
import { ConsultoriaDetailMeetings } from '../ConsultoriaDetailMeetings';
import { ConsultoriaDetailActions } from '../ConsultoriaDetailActions';
import { ConsultoriaDetailDeliverables } from '../ConsultoriaDetailDeliverables';
import { ConsultoriaDetailChat } from '../ConsultoriaDetailChat';
import { ConsultoriaDocumentos } from '../ConsultoriaDocumentos';
import { ConsultoriaDetailMemory } from '../ConsultoriaDetailMemory';
import { PluginInstallerModal } from '../PluginInstallerModal';

export function ConsultoriaDetailPage() {
  const [showPluginInstaller, setShowPluginInstaller] = useState(false);

  const {
    id, navigate, activeTab, setActiveTab,
    consultancy, consultancyLoading, consultancyError,
    insights, aiContextLoading, recentMeetings, generateDiagnosis,
    tabs, hasMeetingsPlugin,
  } = useConsultoriaDetail();

  if (consultancyLoading) return <ConsultoriaDetailSkeleton />;

  if (consultancyError || !consultancy) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <Link to="/consultorias" className="hover:text-[var(--text-secondary)] transition-colors">Consultorias</Link>
          <span>/</span>
          <span className="text-[var(--text-secondary)]">Não encontrada</span>
        </div>
        <div className="rounded-[var(--radius-md)] p-6 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
          <p className="text-sm font-medium text-[var(--text-primary)]">Consultoria não encontrada</p>
          <p className="text-sm text-[var(--text-secondary)]">Esta consultoria não existe ou você não tem acesso a ela.</p>
          <Link to="/consultorias"><Button size="sm" variant="secondary">← Voltar</Button></Link>
        </div>
      </div>
    );
  }

  const handleNewMeeting = () => {
    if (hasMeetingsPlugin) {
      setActiveTab('meetings');
    } else {
      setShowPluginInstaller(true);
    }
  };

  return (
    <>
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="max-w-6xl mx-auto space-y-6 pb-16">
        <motion.div variants={staggerItem}>
          <ConsultoriaDetailHeader
            consultancy={consultancy}
            onEditClick={() => navigate(`/consultorias/${id}/editar`)}
            onGenerateDiagnosis={generateDiagnosis}
            onNewMeeting={handleNewMeeting}
            hasMeetingsPlugin={hasMeetingsPlugin}
          />
        </motion.div>

        <motion.div variants={staggerItem}>
          <ConsultoriaDetailInsights insights={insights} isLoading={aiContextLoading} />
        </motion.div>

        <motion.div variants={staggerItem}>
          <ConsultoriaDetailTabs
            active={activeTab}
            tabs={tabs}
            onChange={setActiveTab}
            onInstallPlugin={() => setShowPluginInstaller(true)}
          />
        </motion.div>

        <motion.div variants={staggerItem}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              {activeTab === 'overview' && <ConsultoriaDetailOverview consultancy={consultancy} insights={insights} recentMeetings={recentMeetings} onTabChange={setActiveTab} />}
              {activeTab === 'ai' && id && <ConsultoriaDetailChat consultancyId={id} clientName={consultancy.client_name} />}
              {activeTab === 'meetings' && id && hasMeetingsPlugin && <ConsultoriaDetailMeetings consultancyId={id} />}
              {activeTab === 'documentos' && id && <ConsultoriaDocumentos consultancyId={id} />}
              {activeTab === 'diagnosis' && id && <ConsultoriaDetailDiagnosis consultancyId={id} />}
              {activeTab === 'actions' && id && <ConsultoriaDetailActions consultancyId={id} />}
              {activeTab === 'deliverables' && id && <ConsultoriaDetailDeliverables consultancyId={id} />}
              {activeTab === 'memory' && id && <ConsultoriaDetailMemory consultancyId={id} />}
              {activeTab === 'dados' && <ConsultoriaDetailDados />}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {showPluginInstaller && id && (
        <PluginInstallerModal
          consultancyId={id}
          onClose={() => setShowPluginInstaller(false)}
        />
      )}
    </>
  );
}
