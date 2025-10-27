'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

export const GradientButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(function GB({ className, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center px-4 py-2 rounded-full text-white',
        'shadow-soft transition-transform active:scale-[0.98]',
        'bg-[image:var(--grad-primary)]',
        className
      )}
      {...props}
    />
  );
});
