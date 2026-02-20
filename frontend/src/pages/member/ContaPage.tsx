import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.ts';
import { useThemeStore } from '../../stores/themeStore.ts';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { ThemeToggle } from '../../components/ui/ThemeToggle.tsx';
import { cn } from '../../lib/cn.ts';

export function ContaPage() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();

  const sections = [
    {
      title: 'Creditos',
      description: 'Gerencie seus creditos e veja o historico de uso.',
      to: '/creditos',
      value: '42 creditos',
    },
    {
      title: 'Plano Atual',
      description: 'Veja e gerencie sua assinatura.',
      to: '#',
      value: 'Plano Pro',
    },
    {
      title: 'Entitlements',
      description: 'Veja seus acessos a cursos e ferramentas.',
      to: '#',
      value: '3 cursos, 4 ferramentas',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-2xl mx-auto space-y-6"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Conta</h1>
      </motion.div>

      {/* User info */}
      <motion.div
        variants={staggerItem}
        className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] transition-colors duration-[var(--duration-normal)]"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[var(--bg-surface-2)] flex items-center justify-center">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {user?.email?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {user?.user_metadata?.full_name || user?.email}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">{user?.email}</p>
          </div>
        </div>
      </motion.div>

      {/* Appearance / Theme section */}
      <motion.div variants={staggerItem} className="space-y-2">
        <h2 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-1">
          Aparencia
        </h2>
        <div
          className={cn(
            'flex items-center justify-between gap-4 rounded-[var(--radius-md)] p-4',
            'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
            'transition-colors duration-[var(--duration-normal)]',
          )}
        >
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              {theme === 'dark' ? 'Modo Noturno' : 'Modo Diurno'}
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Alterne entre tema claro e escuro.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </motion.div>

      {/* Quick links */}
      <motion.div variants={staggerItem} className="space-y-2">
        <h2 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-1">
          Geral
        </h2>
        {sections.map((section) => (
          <Link
            key={section.title}
            to={section.to}
            className={cn(
              'flex items-center justify-between gap-4 rounded-[var(--radius-md)] p-4',
              'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
              'hover:border-[var(--border-default)] transition-all duration-200',
            )}
          >
            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)]">{section.title}</h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{section.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium text-[var(--text-secondary)]">{section.value}</span>
              <svg className="h-4 w-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </Link>
        ))}
      </motion.div>
    </motion.div>
  );
}
