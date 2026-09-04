import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'skeleton rounded-xl border border-white/[0.06] shadow-sm relative overflow-hidden',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };

