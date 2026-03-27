import { cn } from '../../../../lib/cn.ts';

export function FieldsListDragHandle(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn('shrink-0 flex flex-col gap-[3px] cursor-grab active:cursor-grabbing', props.className)}
      style={{ width: 12, ...props.style }}
    >
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-[3px]">
          <div className="w-[3px] h-[3px] rounded-full bg-current opacity-40" />
          <div className="w-[3px] h-[3px] rounded-full bg-current opacity-40" />
        </div>
      ))}
    </div>
  );
}
