import { useState } from 'react';
import type { AnalyticsData } from '../../services/analytics.api';
import type { UTMMode } from '../../types';
import { AnalyticsTrafficPieChart } from '../AnalyticsTrafficPieChart';
import { AnalyticsUTMBreakdown } from '../AnalyticsUTMBreakdown';

// ─── UTMToggle ────────────────────────────────────────────────────────────────

function UTMToggle({ mode, onChange }: { mode: UTMMode; onChange: (m: UTMMode) => void }) {
  return (
    <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-hairline)' }}>
      {(['leads', 'views'] as UTMMode[]).map((m) => (
        <button key={m} onClick={() => onChange(m)} className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
          style={{ background: mode === m ? '#7c5cfc' : 'transparent', color: mode === m ? '#fff' : 'var(--text-tertiary)' }}>
          {m === 'leads' ? 'Leads' : 'Visualizações'}
        </button>
      ))}
    </div>
  );
}

// ─── AnalyticsUTMSection ──────────────────────────────────────────────────────

interface AnalyticsUTMSectionProps {
  data: Pick<AnalyticsData, 'leads' | 'views' | 'traffic_split' | 'utm_breakdown'>;
}

export function AnalyticsUTMSection({ data }: AnalyticsUTMSectionProps) {
  const [mode, setMode] = useState<UTMMode>('leads');

  if (data.leads.length === 0 || data.traffic_split.paid === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[var(--text-tertiary)]">Análise de origem</p>
        <UTMToggle mode={mode} onChange={setMode} />
      </div>
      <AnalyticsTrafficPieChart traffic_split={data.traffic_split} mode={mode} totalViews={data.views} />
      <AnalyticsUTMBreakdown utm_breakdown={data.utm_breakdown} mode={mode} totalViews={data.views} />
    </div>
  );
}
