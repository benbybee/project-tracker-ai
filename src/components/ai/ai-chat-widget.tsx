'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Sparkles, User, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AiChatHistorySidebar } from './ai-chat-history-sidebar';
import { AiChatEnhancedInput } from './ai-chat-enhanced-input';
import { type ParsedMessage } from '@/lib/chat-tags-parser';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  metadata?: any;
  createdAt: Date;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  lastMessageAt: Date;
  isActive: boolean;
}

interface AiChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  isMobile?: boolean;
  className?: string;
}

export function AiChatWidget({
  isOpen,
  onClose,
  onMinimize,
  isMobile = false,
  className = '',
}: AiChatWidgetProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [parsedData, setParsedData] = useState<ParsedMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [viewMode, setViewMode] = useState<'chat' | 'history'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load sessions on mount and ensure we start in chat mode
  useEffect(() => {
    if (isOpen) {
      loadSessions();
      setViewMode('chat');
      if (!currentSessionId) {
        setMessages([]);
      }
    }
  }, [isOpen]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && !isMobile) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMobile, currentSessionId]);

  const loadSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const response = await fetch('/api/ai/chat/sessions');
      const data = await response.json();

      if (response.ok) {
        setSessions(data.sessions || []);
      } else {
        throw new Error(data.error || 'Failed to load sessions');
      }
    } catch (error: any) {
      console.error('Failed to load sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat history',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/ai/chat/sessions/${sessionId}`);
      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages || []);
        setCurrentSessionId(sessionId);
        setViewMode('chat');
      } else {
        throw new Error(data.error || 'Failed to load session');
      }
    } catch (error: any) {
      console.error('Failed to load session:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat',
        variant: 'destructive',
      });
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setViewMode('chat');
    inputRef.current?.focus();
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/ai/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));

        if (currentSessionId === sessionId) {
          handleNewChat();
        }

        toast({
          title: 'Success',
          description: 'Chat deleted',
        });
      } else {
        throw new Error('Failed to delete session');
      }
    } catch (error: any) {
      console.error('Failed to delete session:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete chat',
        variant: 'destructive',
      });
    }
  };

  const handleSend = async () => {
    const messageContent = input.trim();
    if (!messageContent || isLoading) return;

    // Check for validation errors
    if (parsedData && parsedData.hasErrors) {
      toast({
        title: 'Invalid Tags',
        description:
          parsedData.errors[0] || 'Please fix the errors before sending',
        variant: 'destructive',
      });
      return;
    }

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageContent,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: parsedData?.cleanMessage || messageContent,
          originalMessage: messageContent,
          tags: parsedData?.tags || {},
          sessionId: currentSessionId,
          context: { mode: 'general' },
          history: messages.slice(-10),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update session ID if this was a new chat
      if (!currentSessionId && data.sessionId) {
        setCurrentSessionId(data.sessionId);
        // Reload sessions to show the new one
        loadSessions();
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden',
        isMobile ? 'h-full w-full' : 'h-[600px] w-[400px]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-500 to-pink-500">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h3 className="font-semibold text-white">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'chat' ? 'history' : 'chat')}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label={viewMode === 'chat' ? 'Chat History' : 'Back to Chat'}
          >
            <Menu className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'history' ? (
          /* History View - Full Width */
          <AiChatHistorySidebar
            sessions={sessions}
            activeSessionId={currentSessionId || undefined}
            onSelectSession={loadSession}
            onNewChat={handleNewChat}
            onDeleteSession={handleDeleteSession}
            isLoading={isLoadingSessions}
            className="h-full"
          />
        ) : (
          /* Chat View */
          <div className="flex flex-col h-full overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  How can I help you today?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                  I can help you manage tasks, create projects, analyze your
                  productivity, and more.
                </p>
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
            <AiChatEnhancedInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              onParsedDataChange={setParsedData}
              isLoading={isLoading}
              placeholder="What can I help you with?"
            />
          </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
