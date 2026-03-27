import { cn } from '../../../../lib/cn.ts';

interface LivePreviewNavToolbarProps {
  currentIndex: number;
  totalFields: number;
  onNavigate: (index: number) => void;
}

export function LivePreviewNavToolbar({
  currentIndex, totalFields, onNavigate,
}: LivePreviewNavToolbarProps) {
  if (totalFields <= 1) return null;

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2"
      style={{ zIndex: 20 }}
    >
      <div
        className="flex items-center gap-1 px-1.5 py-1.5 rounded-full"
        style={{
          background: 'rgba(30,30,32,0.9)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        <button
          disabled={currentIndex === 0}
          onClick={() => onNavigate(Math.max(0, currentIndex - 1))}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all',
            currentIndex === 0
              ? 'text-[rgba(255,255,255,0.2)] pointer-events-none'
              : 'text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]',
          )}
        >
          &larr; Anterior
        </button>
        <div className="w-px h-4 bg-[rgba(255,255,255,0.12)] mx-0.5" />
        <button
          disabled={currentIndex === totalFields - 1}
          onClick={() => onNavigate(Math.min(totalFields - 1, currentIndex + 1))}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all',
            currentIndex === totalFields - 1
              ? 'text-[rgba(255,255,255,0.2)] pointer-events-none'
              : 'text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]',
          )}
        >
          Proximo &rarr;
        </button>
      </div>
    </div>
  );
}
