export function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatDateTime(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function timeAgo(iso?: string | null) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atras`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atras`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} dias atras`;
  return formatDate(iso);
}

export const ACCESS_LABELS: Record<string, string> = {
  allow: 'Permitido',
  deny: 'Bloqueado',
  full_access: 'Acesso Total',
};

export const ACCESS_VARIANT: Record<string, string> = {
  allow: 'text-[var(--text-primary)] bg-[var(--bg-hover)]',
  full_access: 'text-[var(--text-primary)] bg-[var(--bg-hover)]',
  deny: 'text-[var(--text-tertiary)] bg-[var(--bg-surface-1)] opacity-60',
};

export const TX_TYPE_LABEL: Record<string, string> = {
  purchase: 'Compra',
  monthly_grant: 'Mensal',
  reserve: 'Reserva',
  consume: 'Consumo',
  release: 'Liberacao',
};

export const TX_TYPE_COLOR: Record<string, string> = {
  purchase: 'text-emerald-500',
  monthly_grant: 'text-emerald-500',
  release: 'text-emerald-500',
  reserve: 'text-amber-500',
  consume: 'text-red-500',
};
