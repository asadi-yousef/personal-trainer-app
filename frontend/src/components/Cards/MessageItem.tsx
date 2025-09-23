'use client';

import { useEffect } from 'react';
import { Message } from '../../lib/data';

interface MessageItemProps {
  message: Message;
}

/**
 * Message item component displaying recent messages
 */
export default function MessageItem({ message }: MessageItemProps) {
  useEffect(() => {
    const loadFeatherIcons = async () => {
      try {
        const feather = (await import('feather-icons')).default;
        feather.replace();
      } catch (error) {
        console.error('Failed to load feather icons:', error);
      }
    };
    loadFeatherIcons();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div className={`flex items-start p-3 rounded-lg hover:bg-gray-50 transition-smooth ${message.unread ? 'bg-indigo-50' : ''}`}>
      <div className="relative">
        <img
          src={message.senderAvatar}
          alt={message.sender}
          className="w-10 h-10 rounded-full"
        />
        {message.unread && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full"></div>
        )}
      </div>
      
      <div className="flex-1 ml-3">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-semibold text-gray-900">{message.sender}</h4>
          <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{message.lastMessage}</p>
      </div>
    </div>
  );
}
