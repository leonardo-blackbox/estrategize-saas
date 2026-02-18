interface HorizontalScrollerProps {
  children: React.ReactNode;
}

export function HorizontalScroller({ children }: HorizontalScrollerProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none">
      {children}
    </div>
  );
}
