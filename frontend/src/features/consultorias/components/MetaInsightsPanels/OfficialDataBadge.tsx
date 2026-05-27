interface Props {
  capturedAt?: string;
}

export function OfficialDataBadge({ capturedAt }: Props) {
  const formatted = capturedAt
    ? new Date(capturedAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300">
      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <span>Dados oficiais via Meta</span>
      {formatted && <span className="text-emerald-400/70">· {formatted}</span>}
    </div>
  );
}
