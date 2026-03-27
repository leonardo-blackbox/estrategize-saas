import { cn } from '../../../../lib/cn.ts';

interface DeviceToggleProps {
  device: 'desktop' | 'mobile';
  onChange: (d: 'desktop' | 'mobile') => void;
}

export function LivePreviewDeviceToggle({ device, onChange }: DeviceToggleProps) {
  return (
    <div
      className="flex items-center gap-0.5 p-0.5 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.06)' }}
    >
      {(['desktop', 'mobile'] as const).map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={cn(
            'px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150',
            device === d
              ? 'bg-[rgba(255,255,255,0.12)] text-white'
              : 'text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.7)]',
          )}
        >
          {d === 'desktop' ? '\uD83D\uDDA5' : '\uD83D\uDCF1'}
        </button>
      ))}
    </div>
  );
}
