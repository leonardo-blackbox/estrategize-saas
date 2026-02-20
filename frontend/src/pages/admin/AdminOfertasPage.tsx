import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Badge } from '../../components/ui/Badge.tsx';

const mockOfertas = [
  { id: 'o1', name: 'Plano Essencial', type: 'subscription', price: 'R$ 197/mes', active: true, members: 312 },
  { id: 'o2', name: 'Plano Pro', type: 'subscription', price: 'R$ 497/mes', active: true, members: 89 },
  { id: 'o3', name: 'Masterclass Estrategia', type: 'one-time', price: 'R$ 1.997', active: false, members: 456 },
];

export function AdminOfertasPage() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto space-y-6"
    >
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-[var(--text-primary)]">Ofertas</h1>
        <Link to="/admin/ofertas/nova">
          <Button size="sm">
            Nova Oferta
          </Button>
        </Link>
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-2">
        {mockOfertas.map((oferta) => (
          <div
            key={oferta.id}
            className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] p-3 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-[var(--text-primary)]">{oferta.name}</h3>
                <Badge variant={oferta.active ? 'success' : 'locked'}>
                  {oferta.active ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {oferta.type === 'subscription' ? 'Assinatura' : 'Pagamento unico'} &middot; {oferta.price} &middot; {oferta.members} membros
              </p>
            </div>
            <button className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
              Editar
            </button>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
