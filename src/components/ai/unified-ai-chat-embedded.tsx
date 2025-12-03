'use client';

import React from 'react';
import { UnifiedAiChat, ChatContext } from './unified-ai-chat';
import { cn } from '@/lib/utils';

interface UnifiedAiChatEmbeddedProps {
  context?: ChatContext;
  onSendMessage?: (message: string, context?: ChatContext) => Promise<string>;
  className?: string;
  height?: string;
}

export function UnifiedAiChatEmbedded({
  context,
  onSendMessage,
  className = '',
  height = 'h-[800px]',
}: UnifiedAiChatEmbeddedProps) {
  return (
    <UnifiedAiChat
      context={context}
      onSendMessage={onSendMessage}
      className={cn(height, className)}
    />
  );
}
