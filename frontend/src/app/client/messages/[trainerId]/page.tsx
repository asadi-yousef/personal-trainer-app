'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../../../components/Sidebar';
import PageHeader from '../../../../components/PageHeader';
import ChatWindow from '../../../../components/Messaging/ChatWindow';
import { trainers } from '../../../../lib/api';
import { useAuth } from '../../../../contexts/AuthContext';

interface Trainer {
  id: number;
  user_name: string;
  user_avatar?: string;
  specialty: string;
  rating: number;
}

/**
 * Client Chat Page - Individual conversation with a specific trainer
 */
export default function ClientTrainerChatPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const trainerId = parseInt(params.trainerId as string);

  // Fetch trainer details
  useEffect(() => {
    const fetchTrainer = async () => {
      if (!trainerId || !user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        const trainerData = await trainers.getById(trainerId);
        setTrainer(trainerData);
      } catch (err) {
        console.error('Failed to fetch trainer:', err);
        setError('Failed to load trainer details');
        setTrainer(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainer();
  }, [trainerId]);

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
  }, [sidebarCollapsed, mounted, trainer]);

  const handleBack = () => {
    router.push('/client/messages');
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

  if (error || !trainer) {
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
              <h3 className="text-lg font-medium text-red-900 mb-2">Trainer not found</h3>
              <p className="text-red-700 mb-4">{error || 'The trainer you\'re looking for doesn\'t exist.'}</p>
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
                  Chat with {trainer.user_name}
                </h1>
                <p className="text-gray-600">
                  {trainer.specialty} • ⭐ {trainer.rating.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          {/* Chat Window */}
          <div className="h-[600px]" data-aos="fade-up" data-aos-delay="100">
            <ChatWindow
              key={`client-${trainer.id}`}
              otherUserId={trainer.id}
              otherUserName={trainer.user_name}
              otherUserAvatar={trainer.user_avatar}
              otherUserRole="trainer"
              onBack={handleBack}
            />
          </div>

          {/* Tips for Clients */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6" data-aos="fade-up" data-aos-delay="200">
            <div className="flex items-start space-x-3">
              <i data-feather="lightbulb" className="h-5 w-5 text-blue-600 mt-0.5"></i>
              <div>
                <h3 className="text-sm font-medium text-blue-900">Tips for Effective Communication</h3>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Ask specific questions about your workouts and progress</li>
                  <li>• Share your goals and any challenges you're facing</li>
                  <li>• Update your trainer on how you're feeling after sessions</li>
                  <li>• Be honest about your schedule and availability</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
