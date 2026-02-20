import { motion } from 'framer-motion';
import { useThemeStore } from '../../stores/themeStore.ts';
import { cn } from '../../lib/cn.ts';

interface ThemeToggleProps {
  className?: string;
}

/**
 * iOS-style toggle for Diurno/Noturno theme switching.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Tema noturno ativo. Mudar para diurno.' : 'Tema diurno ativo. Mudar para noturno.'}
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex h-8 w-[52px] shrink-0 items-center',
        'rounded-full cursor-pointer',
        'transition-colors duration-[var(--duration-normal)]',
        isDark
          ? 'bg-[var(--text-primary)]'
          : 'bg-[var(--bg-active)]',
        className,
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className={cn(
          'inline-flex h-6 w-6 items-center justify-center',
          'rounded-full shadow-sm',
          isDark
            ? 'bg-[var(--bg-base)]'
            : 'bg-white',
        )}
        style={{
          marginLeft: isDark ? '24px' : '4px',
        }}
      >
        {/* Moon icon (dark) / Sun icon (light) */}
        {isDark ? (
          <svg className="h-3.5 w-3.5 text-[var(--text-primary)]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5 text-[var(--color-warning)]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4.222 4.222a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM15.657 4.929a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM10 7a3 3 0 100 6 3 3 0 000-6zm-8 3a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm14 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM5.636 14.364a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm9.435.707a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        )}
      </motion.span>
    </button>
  );
}
