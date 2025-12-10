'use client';

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AIActionButtonProps {
  prompt: string;
  label: string;
  context?: any;
  className?: string;
}

export function AIActionButton({
  prompt,
  label,
  context,
  className,
}: AIActionButtonProps) {
  // In a real implementation, this would trigger the AI chat widget
  // For now, we'll dispatch a custom event that the chat widget listens for
  // or use a context if available.

  const handleClick = () => {
    const event = new CustomEvent('ai-chat-open', {
      detail: {
        message: prompt,
        context: {
          ...context,
          mode: 'pattern4', // Ensure AI knows it's Pattern 4 context
        },
      },
    });
    window.dispatchEvent(event);
  };

  return (
    <Button
      onClick={handleClick}
      className={cn(
        'bg-gradient-to-r from-indigo-500/10 to-violet-500/10 hover:from-indigo-500/20 hover:to-violet-500/20 text-indigo-400 border border-indigo-500/20',
        className
      )}
      variant="outline"
    >
      <Sparkles className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
