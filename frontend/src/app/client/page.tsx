'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/Cards/StatCard';
import SessionItem from '../../components/Cards/SessionItem';
import ProgramCard from '../../components/Cards/ProgramCard';
import MessageItem from '../../components/Cards/MessageItem';
import { mockStats, mockSessions, mockProgram, mockMessages } from '../../lib/data';
import { ProtectedRoute, useAuth } from '../../contexts/AuthContext';

/**
 * Client dashboard page with sidebar and main content
 */
function ClientDashboardContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

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
  }, [sidebarCollapsed, mounted]);

  const upcomingSessions = mockSessions.filter(session => 
    session.status === 'Confirmed' || session.status === 'Pending'
  );

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
          {/* Welcome Banner */}
          <div className="bg-indigo-600 rounded-xl p-6 mb-8 text-white" data-aos="fade-up">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                  Welcome back, {user?.full_name?.split(' ')[0] || user?.username}! 👋
                </h1>
                <p className="text-indigo-100">
                  Ready to continue your fitness journey? Schedule your next session today.
                </p>
              </div>
              <button className="mt-4 lg:mt-0 bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-smooth focus-ring">
                Schedule New Session
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {mockStats.map((stat, index) => (
              <div key={stat.id} data-aos="fade-up" data-aos-delay={index * 100}>
                <StatCard stat={stat} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Upcoming Sessions */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h2>
                  <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium focus-ring rounded-md p-1">
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {upcomingSessions.map((session, index) => (
                    <SessionItem key={session.id} session={session} />
                  ))}
                </div>
              </div>

              {/* Weight Progress */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="100">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Weight Progress</h2>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <i data-feather="bar-chart-2" className="h-12 w-12 text-gray-400 mx-auto mb-4"></i>
                    <p className="text-gray-600">Weight tracking chart will be displayed here</p>
                    <p className="text-sm text-gray-500 mt-2">Connect your smart scale to see detailed analytics</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Current Program */}
              <div data-aos="fade-up" data-aos-delay="200">
                <ProgramCard program={mockProgram} />
              </div>

              {/* Recent Messages */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Messages</h2>
                  <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium focus-ring rounded-md p-1">
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {mockMessages.map((message) => (
                    <MessageItem key={message.id} message={message} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  return (
    <ProtectedRoute requiredRole="client">
      <ClientDashboardContent />
    </ProtectedRoute>
  );
}
