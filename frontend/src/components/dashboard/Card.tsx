interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border border-slate-700 bg-slate-800 p-4 ${className}`}>
      {children}
    </div>
  );
}
