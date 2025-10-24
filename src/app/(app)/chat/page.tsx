'use client';

import { ChatPanel } from '@/components/chat/ChatPanel';
import { GlassCard } from '@/components/ui/glass-card';
import { MessageCircle, Users } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Chat</h1>
              <p className="text-gray-600">Collaborate and communicate with your team</p>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <GlassCard className="p-0 overflow-hidden">
          <ChatPanel 
            projectId="default-project" // In a real app, this would come from context or params
            className="h-[600px]"
          />
        </GlassCard>
      </div>
    </div>
  );
}
