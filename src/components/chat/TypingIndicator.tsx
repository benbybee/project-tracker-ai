'use client';

import { motion } from 'framer-motion';
import { User } from 'lucide-react';

interface TypingIndicatorProps {
  users: Array<{
    id: string;
    name: string;
  }>;
  className?: string;
}

export function TypingIndicator({ users, className = '' }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].name} is typing...`;
    } else if (users.length === 2) {
      return `${users[0].name} and ${users[1].name} are typing...`;
    } else {
      return `${users[0].name} and ${users.length - 1} others are typing...`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center space-x-2 px-4 py-2 ${className}`}
    >
      {/* Typing Animation */}
      <div className="flex items-center space-x-1">
        <div className="flex space-x-1">
          <motion.div
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0,
            }}
          />
          <motion.div
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.2,
            }}
          />
          <motion.div
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.4,
            }}
          />
        </div>
      </div>

      {/* User Avatars */}
      <div className="flex -space-x-1">
        {users.slice(0, 3).map((user, index) => (
          <div
            key={user.id}
            className="relative"
            style={{ zIndex: users.length - index }}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        ))}
        {users.length > 3 && (
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
            +{users.length - 3}
          </div>
        )}
      </div>

      {/* Typing Text */}
      <span className="text-sm text-gray-500">
        {getTypingText()}
      </span>
    </motion.div>
  );
}
