'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Send,
  Sparkles,
  Loader2,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  FileText,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ConfirmationModal, ConfirmationData } from './ConfirmationModal';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: Date;
  tool_call_id?: string;
  action?: {
    type: string;
    label: string;
    data: any;
  };
}

export interface ChatContext {
  mode?: 'analytics' | 'project' | 'general';
  projectId?: string;
  projectName?: string;
}

interface QuickPrompt {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  prompt: string;
}

interface UnifiedAiChatProps {
  context?: ChatContext;
  onSendMessage?: (message: string, context?: ChatContext) => Promise<string>;
  className?: string;
  showHeader?: boolean;
  initialMessage?: string | null;
}

const ANALYTICS_PROMPTS: QuickPrompt[] = [
  {
    icon: TrendingUp,
    label: 'Productivity',
    prompt: 'How productive was I last week?',
  },
  {
    icon: AlertCircle,
    label: 'High-risk tasks',
    prompt: 'Show me high-risk tasks',
  },
  {
    icon: TrendingUp,
    label: 'Velocity',
    prompt: 'What is my current velocity?',
  },
  {
    icon: Lightbulb,
    label: 'Best hours',
    prompt: 'When am I most productive?',
  },
];

const PROJECT_PROMPTS: QuickPrompt[] = [
  {
    icon: TrendingUp,
    label: 'Analyze health',
    prompt: 'Analyze the health of this project and identify any risks',
  },
  {
    icon: Lightbulb,
    label: 'Suggest tasks',
    prompt: 'Suggest the next 3-5 tasks I should work on for this project',
  },
  {
    icon: AlertCircle,
    label: 'Find blockers',
    prompt: 'What are the current blockers and how can I resolve them?',
  },
  {
    icon: FileText,
    label: 'Status update',
    prompt: 'Generate a status update for this project',
  },
];

const GENERAL_PROMPTS: QuickPrompt[] = [
  {
    icon: Lightbulb,
    label: "Today's focus",
    prompt: 'What should I work on today?',
  },
  {
    icon: AlertCircle,
    label: 'Overdue tasks',
    prompt: 'Show my overdue tasks',
  },
  {
    icon: FileText,
    label: 'Create project',
    prompt: 'Help me create a new project',
  },
  {
    icon: TrendingUp,
    label: 'Week summary',
    prompt: 'Summarize my week',
  },
];

function getQuickPromptsForContext(context?: ChatContext): QuickPrompt[] {
  if (context?.mode === 'analytics') return ANALYTICS_PROMPTS;
  if (context?.mode === 'project') return PROJECT_PROMPTS;
  return GENERAL_PROMPTS;
}

export function UnifiedAiChat({
  context,
  onSendMessage,
  className = '',
  showHeader = true,
  initialMessage,
}: UnifiedAiChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] =
    useState<ConfirmationData | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const quickPrompts = getQuickPromptsForContext(context);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-send initial message when provided
  useEffect(() => {
    if (initialMessage && !initialMessageSent && !isLoading) {
      setInitialMessageSent(true);
      handleSend(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage, initialMessageSent, isLoading]);

  const handleSend = async (messageContent?: string) => {
    const content = messageContent || input.trim();
    if (!content || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let responseText: string;
      let needsConfirmation = false;
      let confirmData: ConfirmationData | null = null;

      if (onSendMessage) {
        // Use custom message handler if provided
        responseText = await onSendMessage(content, context);
      } else {
        // Default API call
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            context,
            history: messages.slice(-10), // Last 10 messages for context
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        responseText = data.message || data.response;
        needsConfirmation = data.needsConfirmation || false;
        confirmData = data.confirmationData || null;

        // Handle navigation if present
        if (data.navigation && data.navigation.url) {
          // Show brief toast
          toast({
            title: 'Navigating...',
            description:
              data.navigation.message ||
              `Opening ${data.navigation.type || 'page'}...`,
          });

          // Navigate after a brief delay to allow message to be displayed
          // Chat state is persisted in sessionStorage, so it will remain open
          setTimeout(() => {
            router.push(data.navigation.url);
          }, 500);
        }
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If action needs confirmation, show modal
      if (needsConfirmation && confirmData) {
        setConfirmationData(confirmData);
        setShowConfirmation(true);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content:
          'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmationData) return;

    setIsExecuting(true);

    try {
      const response = await fetch('/api/ai/chat/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationData }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to execute action');
      }

      // Show success message
      toast({
        title: 'Success',
        description: data.message,
      });

      // Add success message to chat
      const successMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, successMessage]);

      // Close modal
      setShowConfirmation(false);
      setConfirmationData(null);
    } catch (error: any) {
      console.error('Action execution error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to execute action',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReject = () => {
    setShowConfirmation(false);
    setConfirmationData(null);

    // Add rejection message
    const rejectionMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: 'Action canceled. Is there anything else I can help you with?',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, rejectionMessage]);
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  const getHeaderTitle = () => {
    if (context?.mode === 'analytics') return 'AI Analytics Assistant';
    if (context?.mode === 'project') return 'AI Project Assistant';
    return 'AI Assistant';
  };

  const getHeaderSubtitle = () => {
    if (context?.projectName) return context.projectName;
    if (context?.mode === 'analytics')
      return 'Ask questions about your productivity data';
    return 'Your intelligent productivity assistant';
  };

  return (
    <>
      <ConfirmationModal
        isOpen={showConfirmation}
        confirmationData={confirmationData}
        onConfirm={handleConfirm}
        onReject={handleReject}
        isExecuting={isExecuting}
      />
      <div
        className={cn(
          'bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col',
          className
        )}
      >
        {/* Header */}
        {showHeader && (
          <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {getHeaderTitle()}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                {getHeaderSubtitle()}
              </p>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                How can I help you today?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                {context?.mode === 'analytics'
                  ? 'Ask me anything about your productivity patterns, task completion, or performance metrics.'
                  : context?.mode === 'project'
                    ? 'I can help analyze your project health, suggest tasks, identify blockers, or generate status updates.'
                    : 'I can help you manage tasks, create projects, analyze your productivity, and more.'}
              </p>

              {/* Quick Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {quickPrompts.map((prompt) => {
                  const Icon = prompt.icon;
                  return (
                    <motion.button
                      key={prompt.label}
                      onClick={() => handleQuickPrompt(prompt.prompt)}
                      className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors text-left"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="h-5 w-5 text-purple-500 mb-2" />
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {prompt.label}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3',
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                    <p
                      className={cn(
                        'text-xs mt-2 opacity-60',
                        message.role === 'user'
                          ? 'text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      )}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Thinking...
                </span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                context?.mode === 'analytics'
                  ? 'Ask about your productivity...'
                  : context?.mode === 'project'
                    ? 'Ask about this project...'
                    : 'What can I help you with?'
              }
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
