'use client';

import { useState, useEffect, useRef } from 'react';
import { messages } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  read_at?: string;
  is_read: boolean;
  sender_name: string;
  sender_avatar?: string;
  receiver_name: string;
  receiver_avatar?: string;
}

interface ChatWindowProps {
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar?: string;
  otherUserRole: string;
  onBack?: () => void;
}

/**
 * Shared ChatWindow component for both client and trainer messaging
 */
export default function ChatWindow({ 
  otherUserId, 
  otherUserName, 
  otherUserAvatar, 
  otherUserRole,
  onBack 
}: ChatWindowProps) {
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch message history
  useEffect(() => {
    const fetchMessageHistory = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        const history = await messages.getConversationHistory(user.id, otherUserId);
        setMessageHistory(history || []);
        
        // Mark conversation as read
        if (history && history.length > 0) {
          await messages.markConversationRead(otherUserId, user.id);
        }
      } catch (err) {
        console.error('Failed to fetch message history:', err);
        setError('Failed to load message history');
        setMessageHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessageHistory();
  }, [user, otherUserId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageHistory]);

  // Disabled feather icon refresh to prevent DOM errors

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    
    try {
      setSendingMessage(true);
      setError(null);
      
      const messageData = {
        receiver_id: otherUserId,
        content: newMessage.trim(),
        message_type: 'general',
        is_important: false
      };
      
      await messages.create(messageData);
      setNewMessage('');
      
      // Refresh message history
      const history = await messages.getConversationHistory(user.id, otherUserId);
      setMessageHistory(history || []);
      
      // Mark conversation as read
      await messages.markConversationRead(otherUserId, user.id);
      
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const isMyMessage = (message: Message) => {
    return message.sender_id === user?.id;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="chat-container flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <span>←</span>
            </button>
          )}
          <img
            src={otherUserAvatar || 'https://i.pravatar.cc/200'}
            alt={otherUserName}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="font-medium text-gray-900">{otherUserName}</h3>
            <p className="text-sm text-gray-500 capitalize">{otherUserRole}</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 mx-4 mt-4">
          <div className="flex">
            <span>⚠️</span>
            <p className="ml-2 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messageHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="mb-4">
              <span>💬</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
            <p className="text-sm text-center max-w-md">
              Begin your conversation with {otherUserName}. 
              {user?.role === 'client' 
                ? ' Ask questions about your training or share your progress!'
                : ' Provide guidance, answer questions, and motivate your client!'
              }
            </p>
          </div>
        ) : (
          messageHistory.map((message) => (
            <div
              key={message.id}
              className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-xs lg:max-w-md ${isMyMessage(message) ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
                {!isMyMessage(message) && (
                  <img
                    src={message.sender_avatar || 'https://i.pravatar.cc/200'}
                    alt={message.sender_name}
                    className="w-6 h-6 rounded-full flex-shrink-0"
                  />
                )}
                <div className="flex flex-col">
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      isMyMessage(message)
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <div className={`flex items-center space-x-1 mt-1 ${
                    isMyMessage(message) ? 'justify-end' : 'justify-start'
                  }`}>
                    <span className={`text-xs ${
                      isMyMessage(message) ? 'text-indigo-500' : 'text-gray-500'
                    }`}>
                      {formatTime(message.created_at)}
                    </span>
                    {isMyMessage(message) && message.is_read && (
                      <span className="text-indigo-500">✓</span>
                    )}
                  </div>
                </div>
                {isMyMessage(message) && (
                  <img
                    src={user?.avatar || 'https://i.pravatar.cc/200'}
                    alt={user?.full_name}
                    className="w-6 h-6 rounded-full flex-shrink-0"
                  />
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="flex space-x-2">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Type a message to ${otherUserName}...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              rows={1}
              disabled={sendingMessage}
              style={{
                minHeight: '40px',
                maxHeight: '120px',
                height: 'auto'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendingMessage}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {sendingMessage ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              "Send"
            )}
          </button>
        </div>
        
        {/* Message Guidelines */}
        <div className="mt-2 text-xs text-gray-500">
          {user?.role === 'client' ? (
            <span>💡 Ask about workouts, share progress, or discuss your fitness goals</span>
          ) : (
            <span>💡 Provide guidance, answer questions, and motivate your client</span>
          )}
        </div>
      </div>
    </div>
  );
}
