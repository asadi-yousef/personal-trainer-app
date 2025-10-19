'use client';

import { useState, useEffect, memo } from 'react';
import Sidebar from '../../components/Sidebar';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/Cards/StatCard';
import SessionItem from '../../components/Cards/SessionItem';
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const ProgramViewer = lazy(() => import('../../components/Client/ProgramViewer'));
const MyBookings = lazy(() => import('../../components/Client/MyBookings'));
const ChatInterface = lazy(() => import('../../components/Messaging/ChatInterface'));
const SessionStatus = lazy(() => import('../../components/Client/SessionStatus'));
import { mockStats, mockSessions, mockProgram, mockMessages } from '../../lib/data';
import { ProtectedRoute, useAuth } from '../../contexts/AuthContext';
import { apiClient, sessions, programs, messages, analytics, goals } from '../../lib/api';
import '../../utils/preloader';

/**
 * Client dashboard page with sidebar and main content
 */
function ClientDashboardContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState({
    stats: mockStats,
    sessions: mockSessions,
    program: mockProgram,
    messages: mockMessages,
    goals: [] as any[]
  });
  const { user } = useAuth();

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);

        // Fetch essential data first, then secondary data
        const [sessionsData] = await Promise.allSettled([
          sessions.getAll({ client_id: user.id, upcoming_only: true })
        ]);

        // Fetch secondary data after essential data loads
        const [programsData, messagesData, goalsData, analyticsData] = await Promise.allSettled([
          programs.getMyPrograms(),
          messages.getAll({ receiver_id: user.id }),
          goals.getAll(),
          analytics.getClientAnalytics()
        ]);

        // Process sessions data
        let processedSessions = mockSessions;
        if (sessionsData.status === 'fulfilled' && sessionsData.value) {
          processedSessions = sessionsData.value.map((session: any) => ({
            id: session.id.toString(),
            title: session.session_type || 'Training Session',
            status: session.status === 'confirmed' ? 'Confirmed' : 
                   session.status === 'pending' ? 'Pending' : 
                   session.status === 'completed' ? 'Completed' : 'Cancelled',
            trainerName: session.trainer?.user?.full_name || 'Trainer',
            trainerAvatar: session.trainer?.user?.avatar || 'https://i.pravatar.cc/200',
            location: session.location || 'Gym',
            datetime: session.scheduled_date,
            duration: session.duration_minutes || 60
          }));
        }

        // Process programs data
        let processedProgram = mockProgram;
        if (programsData.status === 'fulfilled' && programsData.value && programsData.value.length > 0) {
          const program = programsData.value[0];
          processedProgram = {
            id: program.id.toString(),
            title: program.program?.name || 'Active Program',
            trainerName: program.program?.trainer?.user?.full_name || 'Trainer',
            trainerAvatar: program.program?.trainer?.user?.avatar || 'https://i.pravatar.cc/200',
            status: program.status === 'active' ? 'Active' : 'Completed',
            description: program.program?.description || 'Your current fitness program',
            duration: `${program.program?.duration_weeks || 12} weeks`,
            exercises: program.program?.workouts?.map((w: any) => w.name) || ['Exercise 1', 'Exercise 2'],
            startDate: program.start_date || '2024-01-01',
            endDate: program.end_date || '2024-03-25'
          };
        }

        // Process messages data
        let processedMessages = mockMessages;
        if (messagesData.status === 'fulfilled' && messagesData.value) {
          processedMessages = messagesData.value.slice(0, 3).map((message: any) => ({
            id: message.id.toString(),
            sender: message.sender?.full_name || 'Trainer',
            senderAvatar: message.sender?.avatar || 'https://i.pravatar.cc/200',
            lastMessage: message.content || 'New message',
            timestamp: message.created_at,
            unread: !message.read_at
          }));
        }

        // Process goals data
        let processedGoals: any[] = [];
        if (goalsData.status === 'fulfilled' && goalsData.value) {
          processedGoals = goalsData.value.map((goal: any) => ({
            id: goal.id.toString(),
            title: goal.goal_type || 'Fitness Goal',
            target: goal.target_value,
            current: goal.current_value || 0,
            unit: goal.unit || '',
            deadline: goal.target_date,
            isActive: goal.is_active,
            isAchieved: goal.is_achieved
          }));
        }

        // Generate dynamic stats based on real data
        const dynamicStats = [
          {
            id: '1',
            title: 'Sessions Completed',
            value: processedSessions.filter(s => s.status === 'Completed').length.toString(),
            change: '+12%',
            changeType: 'increase' as const,
            icon: 'check-circle',
            color: 'green'
          },
          {
            id: '2',
            title: 'Current Weight',
            value: '165 lbs',
            change: '-5 lbs',
            changeType: 'decrease' as const,
            icon: 'trending-down',
            color: 'blue'
          },
          {
            id: '3',
            title: 'Goal Progress',
            value: processedGoals.length > 0 ? 
              `${Math.round((processedGoals.filter(g => g.isAchieved).length / processedGoals.length) * 100)}%` : '68%',
            change: '+8%',
            changeType: 'increase' as const,
            icon: 'target',
            color: 'purple'
          },
          {
            id: '4',
            title: 'Next Session',
            value: processedSessions.length > 0 ? 'Tomorrow' : 'No upcoming sessions',
            change: processedSessions.length > 0 ? processedSessions[0].datetime.split('T')[1].substring(0, 5) : '',
            icon: 'clock',
            color: 'indigo'
          }
        ];

        setDashboardData({
          stats: dynamicStats,
          sessions: processedSessions,
          program: processedProgram,
          messages: processedMessages,
          goals: processedGoals
        });

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Using demo data.');
        // Keep mock data as fallback
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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

    initAOS();
  }, []);

  // Upcoming = future only (timezone-safe) and confirmed/pending
  const upcomingSessions = dashboardData.sessions
    .filter(session => session.status === 'Confirmed' || session.status === 'Pending')
    .filter(session => {
      if (!session.datetime) return false;
      const d = new Date(session.datetime);
      if (isNaN(d.getTime())) return false;
      const now = new Date();
      return d.getTime() >= now.getTime();
    })
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

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
              <button 
                onClick={() => window.location.href = '/optimal-scheduling'}
                className="mt-4 lg:mt-0 bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-smooth focus-ring"
              >
                Browse Optimal Times
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <i data-feather="alert-triangle" className="h-5 w-5 text-yellow-400"></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {dashboardData.stats.map((stat, index) => (
                <div key={stat.id} data-aos="fade-up" data-aos-delay={index * 100}>
                  <StatCard stat={stat} />
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Upcoming Sessions */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h2>
                  <button 
                    onClick={() => window.location.href = '/optimal-scheduling'}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium focus-ring rounded-md p-1"
                  >
                    Browse Times
                  </button>
                </div>
                <Suspense fallback={<div className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>}>
                  <SessionStatus />
                </Suspense>
              </div>

              {/* My Bookings */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="50">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">My Bookings</h2>
                <Suspense fallback={<div className="h-48 bg-gray-100 rounded-lg animate-pulse"></div>}>
                  <MyBookings />
                </Suspense>
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
              {/* Programs */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="200">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">My Programs</h2>
                <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>}>
                  <ProgramViewer />
                </Suspense>
              </div>

              {/* Messages */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="300">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Messages</h2>
                <Suspense fallback={<div className="h-48 bg-gray-100 rounded-lg animate-pulse"></div>}>
                  <ChatInterface />
                </Suspense>
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
