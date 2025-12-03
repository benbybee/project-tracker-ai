'use client';

import React from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AiAnalyticsChatProps {
  className?: string;
}

export function AiAnalyticsChat({ className = '' }: AiAnalyticsChatProps) {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Hi! I can help you understand your productivity data. Ask me things like:\n\n• "How productive was I last week?"\n• "Which projects are at risk?"\n• "When am I most productive?"\n• "How many tasks can I complete this week?"\n\nWhat would you like to know?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
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

    try {
      // Call AI chat API endpoint
      const response = await fetch('/api/ai/analytics-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          data.response || 'I apologize, but I could not process that request.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
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

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  const quickQuestions = [
    'How many tasks did I complete this week?',
    'What are my most productive hours?',
    'Show me high-risk tasks',
    'What is my current velocity?',
  ];

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            AI Analytics Assistant
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Ask questions about your productivity data
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px] max-h-[600px]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                ${
                  message.role === 'user'
                    ? 'bg-blue-100 dark:bg-blue-900/50'
                    : 'bg-gradient-to-br from-purple-500 to-blue-500'
                }
              `}
            >
              {message.role === 'user' ? (
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <Bot className="h-4 w-4 text-white" />
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`
                flex-1 max-w-[80%] rounded-2xl px-4 py-3
                ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100'
                }
              `}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
              <p
                className={`
                  text-xs mt-2 opacity-60
                  ${message.role === 'user' ? 'text-white' : 'text-slate-600 dark:text-slate-400'}
                `}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-600 dark:text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Thinking...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-3 border-t border-slate-200 dark:border-slate-700 pt-3">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
            Quick questions:
          </p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-slate-200 dark:border-slate-700"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your productivity..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
