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
 * Trainer Messages Page - Lists all conversations with clients
 */
export default function TrainerMessagesPage() {
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
        const conversationsData = await messages.getConversations();
        // Sort by most recent activity (unread messages first, then by last message time)
        const sortedConversations = (conversationsData || []).sort((a, b) => {
          // Prioritize conversations with unread messages
          if (a.unread_count > 0 && b.unread_count === 0) return -1;
          if (a.unread_count === 0 && b.unread_count > 0) return 1;
          
          // Then sort by last message time
          if (!a.last_message_at && !b.last_message_at) return 0;
          if (!a.last_message_at) return 1;
          if (!b.last_message_at) return -1;
          
          return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        });
        setConversations(sortedConversations);
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

  const handleConversationClick = (clientId: number) => {
    router.push(`/trainer/messages/${clientId}`);
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

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
                  Communicate with your clients and manage training discussions.
                </p>
              </div>
              <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                {totalUnread > 0 && (
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {totalUnread} unread
                  </div>
                )}
                <button
                  onClick={() => router.push('/trainer/schedule')}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 focus-ring transition-smooth"
                >
                  Manage Schedule
                </button>
              </div>
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
                <h2 className="text-xl font-semibold text-gray-900">Client Conversations</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <i data-feather="users" className="h-4 w-4"></i>
                    <span>{conversations.length} active conversations</span>
                  </div>
                  {totalUnread > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-red-600">
                      <i data-feather="bell" className="h-4 w-4"></i>
                      <span>{totalUnread} unread messages</span>
                    </div>
                  )}
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
                    When clients book sessions with you, you'll be able to communicate with them here.
                  </p>
                  <button
                    onClick={() => router.push('/trainer/schedule')}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 focus-ring transition-smooth"
                  >
                    Set Up Your Schedule
                  </button>
                </div>
              ) : (
                conversations.map((conversation, index) => {
                  // Determine the other participant
                  const isParticipant1 = user?.id === conversation.participant1_id;
                  const otherUser = isParticipant1 ? {
                    id: conversation.participant2_id,
                    name: conversation.participant2_name,
                    avatar: conversation.participant2_avatar
                  } : {
                    id: conversation.participant1_id,
                    name: conversation.participant1_name,
                    avatar: conversation.participant1_avatar
                  };

                  return (
                    <div
                      key={conversation.id}
                      onClick={() => handleConversationClick(otherUser.id)}
                      className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                        conversation.unread_count > 0 ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      data-aos="fade-up"
                      data-aos-delay={index * 100}
                    >
                      <div className="flex items-center space-x-4">
                        {/* Avatar */}
                        <div className="relative">
                          <img
                            src={otherUser.avatar || 'https://i.pravatar.cc/200'}
                            alt={otherUser.name || 'Unknown User'}
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
                            <h3 className={`text-lg font-medium truncate ${
                              conversation.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {otherUser.name || 'Unknown User'}
                            </h3>
                          <div className="flex items-center space-x-2">
                            {conversation.last_message_at && (
                              <span className="text-sm text-gray-500">
                                {formatTime(conversation.last_message_at)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-500 mt-1">Click to view conversation</p>
                      </div>

                      {/* Arrow */}
                      <div className="flex-shrink-0">
                        <i data-feather="chevron-right" className="h-5 w-5 text-gray-400"></i>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Trainer Tips */}
          {conversations.length > 0 && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6" data-aos="fade-up" data-aos-delay="200">
              <div className="flex items-start space-x-3">
                <i data-feather="lightbulb" className="h-5 w-5 text-green-600 mt-0.5"></i>
                <div>
                  <h3 className="text-sm font-medium text-green-900">Trainer Tips</h3>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>• Respond to client messages within 24 hours for better relationships</li>
                    <li>• Use messages to provide workout tips and motivation</li>
                    <li>• Confirm session details and answer any questions</li>
                    <li>• Share progress updates and celebrate achievements</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}