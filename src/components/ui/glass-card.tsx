'use client';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  'aria-busy'?: boolean;
}

export function GlassCard({
  className,
  children,
  onClick,
  'aria-busy': ariaBusy,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border shadow-soft p-5',
        'backdrop-blur-xl',
        'bg-[color:rgb(var(--glass-bg))] border-[color:rgb(var(--glass-border))]',
        className
      )}
      onClick={onClick}
      aria-busy={ariaBusy}
    >
      {children}
    </div>
  );
}
