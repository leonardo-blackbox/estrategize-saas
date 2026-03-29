import { useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { useStripeProducts } from '../../hooks/useStripeProducts.ts';
import { PlanCard } from '../PlanCard';
import { PlanFormModal } from '../PlanFormModal';
import { type StripeProduct, type CreateProductInput } from '../../../../api/stripe.ts';

export function AdminPlanosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StripeProduct | null>(null);

  const {
    products,
    isLoading,
    createProduct,
    updateProduct,
    archiveProduct,
    isCreating,
    isUpdating,
    isArchiving,
  } = useStripeProducts();

  function handleOpenCreate() {
    setEditingPlan(null);
    setIsModalOpen(true);
  }

  function handleEdit(plan: StripeProduct) {
    setEditingPlan(plan);
    setIsModalOpen(true);
  }

  function handleClose() {
    setIsModalOpen(false);
    setEditingPlan(null);
  }

  function handleSubmit(input: CreateProductInput) {
    if (editingPlan) {
      updateProduct.mutate(
        { id: editingPlan.id, input: { name: input.name, description: input.description, credits: input.credits } },
        { onSuccess: handleClose },
      );
    } else {
      createProduct.mutate(input, { onSuccess: handleClose });
    }
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto space-y-5"
    >
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--text-primary)]">Planos e Stripe</h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Gerencie planos de assinatura.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="text-xs font-semibold px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 transition-opacity"
        >
          Novo Plano
        </button>
      </motion.div>

      <motion.div variants={staggerItem}>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm text-[var(--text-tertiary)]">Nenhum plano cadastrado.</p>
            <button
              onClick={handleOpenCreate}
              className="text-xs font-medium px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              Criar primeiro plano
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onEdit={handleEdit}
                onArchive={(id) => archiveProduct.mutate(id)}
                isArchiving={isArchiving}
              />
            ))}
          </div>
        )}
      </motion.div>

      <PlanFormModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
        editPlan={editingPlan}
      />
    </motion.div>
  );
}
