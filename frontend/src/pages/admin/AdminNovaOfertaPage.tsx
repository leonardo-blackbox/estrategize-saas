import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { cn } from '../../lib/cn.ts';
import { Button } from '../../components/ui/Button.tsx';

const steps = ['Tipo', 'Detalhes', 'Precos', 'Entitlements', 'Revisar'];

export function AdminNovaOfertaPage() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Breadcrumb */}
      <motion.div variants={staggerItem} className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
        <Link to="/admin/ofertas" className="hover:text-[var(--text-secondary)] transition-colors">
          Ofertas
        </Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">Nova Oferta</span>
      </motion.div>

      <motion.div variants={staggerItem}>
        <h1 className="text-base font-semibold text-[var(--text-primary)]">Criar Nova Oferta</h1>
      </motion.div>

      {/* Stepper */}
      <motion.div variants={staggerItem} className="flex items-center gap-1">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-1">
            <button
              onClick={() => setCurrentStep(i)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-medium transition-colors',
                i === currentStep
                  ? 'bg-[var(--bg-surface-2)] text-[var(--text-primary)]'
                  : i < currentStep
                    ? 'text-[var(--text-secondary)]'
                    : 'text-[var(--text-muted)]',
              )}
            >
              <span className={cn(
                'h-4 w-4 rounded-full text-[10px] flex items-center justify-center font-bold',
                i === currentStep
                  ? 'bg-[var(--text-primary)] text-[var(--bg-base)]'
                  : i < currentStep
                    ? 'bg-[var(--bg-active)] text-[var(--text-secondary)]'
                    : 'bg-[var(--bg-hover)] text-[var(--text-muted)]',
              )}>
                {i + 1}
              </span>
              <span className="hidden sm:inline">{step}</span>
            </button>
            {i < steps.length - 1 && (
              <div className="w-4 h-px bg-[var(--border-hairline)]" />
            )}
          </div>
        ))}
      </motion.div>

      {/* Step content placeholder */}
      <motion.div
        variants={staggerItem}
        className="rounded-[var(--radius-md)] p-6 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] min-h-[200px] flex items-center justify-center"
      >
        <p className="text-sm text-[var(--text-tertiary)]">
          Passo {currentStep + 1}: {steps[currentStep]} (placeholder)
        </p>
      </motion.div>

      {/* Navigation buttons */}
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Voltar
        </Button>
        <Button
          size="sm"
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
        >
          {currentStep === steps.length - 1 ? 'Criar Oferta' : 'Proximo'}
        </Button>
      </motion.div>
    </motion.div>
  );
}
