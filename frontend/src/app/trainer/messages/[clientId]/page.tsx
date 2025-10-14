'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../../../components/Sidebar';
import PageHeader from '../../../../components/PageHeader';
import ChatWindow from '../../../../components/Messaging/ChatWindow';
import { messages } from '../../../../lib/api';
import { useAuth } from '../../../../contexts/AuthContext';

interface Client {
  id: number;
  full_name: string;
  avatar?: string;
  email: string;
  role: string;
}

/**
 * Trainer Chat Page - Individual conversation with a specific client
 */
export default function TrainerClientChatPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const clientId = parseInt(params.clientId as string);

  // Fetch client details
  useEffect(() => {
    const fetchClient = async () => {
      if (!clientId || !user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Try to get client info from conversation history
        try {
          if (!user?.id) {
            throw new Error('User not authenticated');
          }
          const history = await messages.getConversationHistory(user.id, clientId);
          if (history && history.length > 0) {
            const firstMessage = history[0];
            const clientData = {
              id: clientId,
              full_name: firstMessage.receiver_name || firstMessage.sender_name || 'Client',
              avatar: firstMessage.receiver_avatar || firstMessage.sender_avatar,
              email: 'client@example.com', // Placeholder
              role: 'client'
            };
            setClient(clientData);
          } else {
            // Fallback if no conversation exists yet
            setClient({
              id: clientId,
              full_name: 'Client',
              avatar: 'https://i.pravatar.cc/200',
              email: 'client@example.com',
              role: 'client'
            });
          }
        } catch (historyError) {
          // If conversation doesn't exist yet, use fallback
          console.log('No conversation exists yet, using fallback client data');
          setClient({
            id: clientId,
            full_name: 'Client',
            avatar: 'https://i.pravatar.cc/200',
            email: 'client@example.com',
            role: 'client'
          });
        }
      } catch (err) {
        console.error('Failed to fetch client:', err);
        setError('Failed to load client details');
        setClient(null);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId, user]);

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
  }, [sidebarCollapsed, mounted, client]);

  const handleBack = () => {
    router.push('/trainer/messages');
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

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        <div className={`main-content transition-all duration-300 ${sidebarCollapsed ? 'content-collapsed' : 'content-expanded'}`}>
          <PageHeader user={user} />
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="mb-4">
                <i data-feather="alert-triangle" className="h-12 w-12 text-red-400 mx-auto"></i>
              </div>
              <h3 className="text-lg font-medium text-red-900 mb-2">Client not found</h3>
              <p className="text-red-700 mb-4">{error || 'The client you\'re looking for doesn\'t exist.'}</p>
              <button
                onClick={handleBack}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 focus-ring transition-smooth"
              >
                Back to Messages
              </button>
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
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i data-feather="arrow-left" className="h-5 w-5 text-gray-600"></i>
              </button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  Chat with {client.full_name}
                </h1>
                <p className="text-gray-600">
                  Client • {client.email}
                </p>
              </div>
            </div>
          </div>

          {/* Chat Window */}
          <div className="h-[600px]" data-aos="fade-up" data-aos-delay="100">
            <ChatWindow
              key={`trainer-${client.id}`}
              otherUserId={client.id}
              otherUserName={client.full_name}
              otherUserAvatar={client.avatar}
              otherUserRole="client"
              onBack={handleBack}
            />
          </div>

          {/* Tips for Trainers */}
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6" data-aos="fade-up" data-aos-delay="200">
            <div className="flex items-start space-x-3">
              <i data-feather="lightbulb" className="h-5 w-5 text-green-600 mt-0.5"></i>
              <div>
                <h3 className="text-sm font-medium text-green-900">Tips for Effective Client Communication</h3>
                <ul className="text-sm text-green-700 mt-2 space-y-1">
                  <li>• Provide clear workout instructions and modifications</li>
                  <li>• Offer motivation and celebrate client achievements</li>
                  <li>• Answer questions promptly and thoroughly</li>
                  <li>• Share nutrition tips and lifestyle advice when relevant</li>
                  <li>• Keep communication professional but friendly</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
