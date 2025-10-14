'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import PageHeader from '../../../components/PageHeader';
import { messages } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';

interface Conversation {
  conversation_id: number;
  other_user: {
    id: number;
    name: string;
    role: string;
    avatar?: string;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: number;
  };
  unread_count: number;
  last_message_at?: string;
}

/**
 * Client Messages Page - Lists all conversations with trainers
 */
export default function ClientMessagesPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        const conversationsData = await messages.getUserConversations(user.id);
        setConversations(conversationsData || []);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
        setError('Failed to load conversations');
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  useEffect(() => {
    setMounted(true);
    // Initialize AOS animations
    const initAOS = async () => {
      const AOS = (await import('aos')).default;
      AOS.init({
        duration: 800,
        once: true,
        offset: 100,
      });
    };

    // Initialize feather icons
    const initFeather = async () => {
      const feather = (await import('feather-icons')).default;
      feather.replace();
    };

    initAOS();
    initFeather();
  }, []);

  useEffect(() => {
    if (mounted) {
      const loadFeatherIcons = async () => {
        try {
          const feather = (await import('feather-icons')).default;
          feather.replace();
        } catch (error) {
          console.error('Failed to load feather icons:', error);
        }
      };
      loadFeatherIcons();
    }
  }, [sidebarCollapsed, mounted, conversations]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const handleConversationClick = (trainerId: number) => {
    router.push(`/client/messages/${trainerId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        <div className={`main-content transition-all duration-300 ${sidebarCollapsed ? 'content-collapsed' : 'content-expanded'}`}>
          <PageHeader user={user} />
          <div className="p-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Content */}
      <div className={`main-content transition-all duration-300 ${sidebarCollapsed ? 'content-collapsed' : 'content-expanded'}`}>
        {/* Top Bar */}
        <PageHeader user={user} />

        <div className="p-6">
          {/* Page Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8" data-aos="fade-up">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Messages 💬
                </h1>
                <p className="text-gray-600">
                  Chat with your trainers and manage your conversations.
                </p>
              </div>
              <button
                onClick={() => router.push('/client/schedule')}
                className="mt-4 lg:mt-0 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 focus-ring transition-smooth"
              >
                Book New Session
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" data-aos="fade-down">
              <div className="flex">
                <div className="flex-shrink-0">
                  <i data-feather="alert-triangle" className="h-5 w-5 text-red-400"></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Conversations List */}
          <div className="bg-white rounded-xl shadow-lg" data-aos="fade-up" data-aos-delay="100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Your Conversations</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <i data-feather="users" className="h-4 w-4"></i>
                  <span>{conversations.length} active conversations</span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mb-4">
                    <i data-feather="message-circle" className="h-12 w-12 text-gray-400 mx-auto"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                  <p className="text-gray-600 mb-4">
                    You can only message trainers you have confirmed bookings with.
                  </p>
                  <button
                    onClick={() => router.push('/client/schedule')}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 focus-ring transition-smooth"
                  >
                    Book Your First Session
                  </button>
                </div>
              ) : (
                conversations.map((conversation, index) => (
                  <div
                    key={conversation.conversation_id}
                    onClick={() => handleConversationClick(conversation.other_user.id)}
                    className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                    data-aos="fade-up"
                    data-aos-delay={index * 100}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="relative">
                        <img
                          src={conversation.other_user.avatar || 'https://i.pravatar.cc/200'}
                          alt={conversation.other_user.name}
                          className="w-12 h-12 rounded-full"
                        />
                        {conversation.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {conversation.unread_count}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {conversation.other_user.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {conversation.last_message_at && (
                              <span className="text-sm text-gray-500">
                                {formatTime(conversation.last_message_at)}
                              </span>
                            )}
                            {conversation.other_user.role === 'trainer' && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                Trainer
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {conversation.last_message ? (
                          <p className={`text-sm mt-1 truncate ${
                            conversation.unread_count > 0 ? 'font-medium text-gray-900' : 'text-gray-600'
                          }`}>
                            {conversation.last_message.sender_id === user?.id ? 'You: ' : ''}
                            {conversation.last_message.content}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 mt-1">No messages yet</p>
                        )}
                      </div>

                      {/* Arrow */}
                      <div className="flex-shrink-0">
                        <i data-feather="chevron-right" className="h-5 w-5 text-gray-400"></i>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Info Card */}
          {conversations.length > 0 && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6" data-aos="fade-up" data-aos-delay="200">
              <div className="flex items-start space-x-3">
                <i data-feather="info" className="h-5 w-5 text-blue-600 mt-0.5"></i>
                <div>
                  <h3 className="text-sm font-medium text-blue-900">Messaging Guidelines</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    You can only message trainers you have confirmed or completed sessions with. 
                    This ensures meaningful conversations about your fitness journey.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
