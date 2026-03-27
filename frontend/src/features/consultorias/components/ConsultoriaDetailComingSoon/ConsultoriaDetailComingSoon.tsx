import { Badge } from '../../../../components/ui/Badge.tsx';

interface ConsultoriaDetailComingSoonProps {
  icon: string;
  title: string;
  description: string;
}

export function ConsultoriaDetailComingSoon({ icon, title, description }: ConsultoriaDetailComingSoonProps) {
  return (
    <div className="rounded-[var(--radius-md)] p-10 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] flex flex-col items-center justify-center text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface-2)] flex items-center justify-center text-2xl">{icon}</div>
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-xs">{description}</p>
      </div>
      <Badge variant="drip" size="sm">Em desenvolvimento</Badge>
    </div>
  );
}
