import { cn } from '@/lib/utils';

interface SkeletonGlassProps {
  className?: string;
  children?: React.ReactNode;
}

export function SkeletonGlass({
  className = '',
  children,
}: SkeletonGlassProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-white/40 bg-white/40 backdrop-blur animate-pulse',
        className
      )}
    >
      {children}
    </div>
  );
}
