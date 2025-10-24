'use client';

import { useRealtime } from '@/app/providers';
import { useState } from 'react';

export function RealtimeTest() {
  const { isConnected, status, onlineUsers, updatePresence, startTyping, stopTyping } = useRealtime();
  const [testProjectId, setTestProjectId] = useState('test-project-1');
  const [testTaskId, setTestTaskId] = useState('test-task-1');

  return (
    <div className="fixed bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
      <h3 className="font-semibold text-sm mb-2">Real-time Test Panel</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <span className="font-medium">Status:</span> 
          <span className={`ml-1 px-2 py-1 rounded text-xs ${
            status === 'connected' ? 'bg-green-100 text-green-800' :
            status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
            status === 'error' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {status}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Connected:</span> 
          <span className={`ml-1 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Online Users:</span> 
          <span className="ml-1">{onlineUsers.length}</span>
        </div>
        
        {onlineUsers.length > 0 && (
          <div className="mt-2">
            <div className="font-medium mb-1">Users:</div>
            {onlineUsers.map((user, index) => (
              <div key={user.userId || index} className="text-xs text-gray-600">
                • {user.userName || 'Unknown'} {user.isEditing ? '(editing)' : ''}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-3 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={testProjectId}
            onChange={(e) => setTestProjectId(e.target.value)}
            placeholder="Project ID"
            className="text-xs px-2 py-1 border rounded w-full"
          />
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={testTaskId}
            onChange={(e) => setTestTaskId(e.target.value)}
            placeholder="Task ID"
            className="text-xs px-2 py-1 border rounded w-full"
          />
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => updatePresence({ currentProject: testProjectId })}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            Update Presence
          </button>
          
          <button
            onClick={() => startTyping('task', testTaskId)}
            className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
          >
            Start Typing
          </button>
          
          <button
            onClick={() => stopTyping('task', testTaskId)}
            className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            Stop Typing
          </button>
        </div>
      </div>
    </div>
  );
}
