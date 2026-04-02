import type { ReactNode } from 'react';

interface OptionsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function OptionsSection({ title, description, children }: OptionsSectionProps) {
  return (
    <section className="py-6">
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</h3>
        {description && (
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
