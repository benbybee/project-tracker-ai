'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, MessageCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { AgentMessageBubble } from '@/components/chat/AgentMessageBubble';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

type ChatMode = 'chat' | 'agent';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?:
    | 'thinking'
    | 'executing'
    | 'completed'
    | 'failed'
    | 'approval_needed'
    | 'response';
  intent?: string;
  actions?: any[];
  results?: any[];
  error?: string;
  timestamp: Date;
}

export default function AIChatPage() {
  const [mode, setMode] = useState<ChatMode>('agent');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        mode === 'agent'
          ? "Hi! I'm your AI agent. I can help you:\n\n• Create projects and tasks\n• Update and manage existing items\n• Search and analyze your work\n• Generate reports and insights\n\nWhat would you like me to do?"
          : 'Hi! I can help you understand your productivity data. Ask me anything!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<{
    messageId: string;
    actions: any[];
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const executeCommandMutation = trpc.agent.executeCommand.useMutation();
  const approveActionsMutation = trpc.agent.approveActions.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add thinking message
    const thinkingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      type: 'thinking',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, thinkingMessage]);

    try {
      const result = await executeCommandMutation.mutateAsync({
        command: userMessage.content,
      });

      // Remove thinking message
      setMessages((prev) => prev.filter((m) => m.id !== thinkingMessage.id));

      if (result.type === 'approval_needed') {
        // Add approval needed message
        const approvalMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: '',
          type: 'approval_needed',
          intent: result.intent,
          actions: result.actions,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, approvalMessage]);
        setPendingApproval({
          messageId: approvalMessage.id,
          actions: result.actions || [],
        });
      } else if (result.type === 'execution') {
        // Add completed message with results
        const completedMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: '',
          type: 'completed',
          intent: result.intent,
          results: result.results,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, completedMessage]);
        toast.success('Actions completed successfully!');
      } else if (result.type === 'response') {
        // Regular response message
        const responseMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: result.message || '',
          type: 'response',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, responseMessage]);
      } else if (result.type === 'error') {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Agent error:', error);

      // Remove thinking message
      setMessages((prev) => prev.filter((m) => m.id !== thinkingMessage.id));

      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: '',
        type: 'failed',
        error: error.message || 'Failed to process request',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error('Failed to process request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (actions: any[]) => {
    if (!pendingApproval) return;

    setIsLoading(true);

    // Update message to executing
    setMessages((prev) =>
      prev.map((m) =>
        m.id === pendingApproval.messageId
          ? { ...m, type: 'executing' as const }
          : m
      )
    );

    try {
      const result = await approveActionsMutation.mutateAsync({ actions });

      // Update message to completed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingApproval.messageId
            ? {
                ...m,
                type: 'completed' as const,
                results: result.results,
              }
            : m
        )
      );

      setPendingApproval(null);
      toast.success('Actions completed successfully!');
    } catch (error: any) {
      console.error('Approval error:', error);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingApproval.messageId
            ? {
                ...m,
                type: 'failed' as const,
                error: error.message || 'Failed to execute actions',
              }
            : m
        )
      );

      toast.error('Failed to execute actions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = () => {
    if (!pendingApproval) return;

    setMessages((prev) =>
      prev.filter((m) => m.id !== pendingApproval.messageId)
    );
    setPendingApproval(null);
    toast.info('Actions cancelled');
  };

  const quickActions =
    mode === 'agent'
      ? [
          'Create a new project',
          'Show me overdue tasks',
          'Mark my tasks as completed',
          'Get project statistics',
        ]
      : [
          'How productive was I this week?',
          'What tasks are due today?',
          'Show me my completion rate',
        ];

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-4xl px-2 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  AI Assistant
                </h1>
                <p className="text-gray-600">
                  {mode === 'agent'
                    ? 'Your intelligent agent for task management'
                    : 'Ask questions about your productivity'}
                </p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('chat')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'chat'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageCircle className="h-4 w-4 inline mr-2" />
                Chat
              </button>
              <button
                onClick={() => setMode('agent')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'agent'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Bot className="h-4 w-4 inline mr-2" />
                Agent
              </button>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="h-[600px] flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <AnimatePresence>
                {messages.map((message) =>
                  message.role === 'user' ? (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 flex-row-reverse"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="bg-blue-600 text-white rounded-2xl px-4 py-3 max-w-[80%]">
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <p className="text-xs opacity-75 mt-2">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <AgentMessageBubble
                      key={message.id}
                      type={message.type || 'response'}
                      intent={message.intent}
                      message={message.content}
                      actions={message.actions}
                      results={message.results}
                      error={message.error}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  )
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 2 && (
              <div className="px-6 py-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2">Quick actions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(action)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-700 transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-6 border-t border-gray-200"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    mode === 'agent'
                      ? 'What would you like me to do?'
                      : 'Ask about your productivity...'
                  }
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
