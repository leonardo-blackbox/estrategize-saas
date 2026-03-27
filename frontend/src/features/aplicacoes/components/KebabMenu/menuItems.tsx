export interface KebabMenuProps {
  onEdit: () => void;
  onResponses: () => void;
  onShare: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onOpenChange?: (open: boolean) => void;
}

interface MenuItem { label: string; onClick: () => void; danger?: boolean; icon: React.ReactNode; }

export function buildMenuItems(p: KebabMenuProps): MenuItem[] {
  return [
    { label: 'Editar', onClick: p.onEdit,
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg> },
    { label: 'Ver Respostas', onClick: p.onResponses,
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7s2.5-4.5 6-4.5S13 7 13 7s-2.5 4.5-6 4.5S1 7 1 7z" stroke="currentColor" strokeWidth="1.3" fill="none" /><circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.3" fill="none" /></svg> },
    { label: 'Compartilhar', onClick: p.onShare,
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10 1l3 3-3 3M13 4H5a3 3 0 000 6h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg> },
    { label: 'Duplicar', onClick: p.onDuplicate,
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none" /><path d="M2 10V2h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg> },
    { label: 'Excluir', onClick: p.onDelete, danger: true,
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.7 7.5h6.6L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg> },
  ];
}
