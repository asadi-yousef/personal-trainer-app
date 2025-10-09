'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/Cards/StatCard';
import BookingManager from '../../components/Trainer/BookingManager';
import BookingRequestManager from '../../components/Trainer/BookingRequestManager';
import AvailabilityManager from '../../components/Trainer/AvailabilityManager';
import ProgramManager from '../../components/Trainer/ProgramManager';
import TrainerOptimalScheduler from '../../components/Trainer/TrainerOptimalScheduler';
import ScheduleAnalytics from '../../components/Trainer/ScheduleAnalytics';
import ChatInterface from '../../components/Messaging/ChatInterface';
import { mockTrainerStats, mockTrainerBookings, mockTrainerPrograms } from '../../lib/data';
import { ProtectedRoute, useAuth } from '../../contexts/AuthContext';
import { apiClient, bookings, programs, analytics } from '../../lib/api';
import ProfileCompletionCheck from '../../components/Trainer/ProfileCompletionCheck';

/**
 * Trainer dashboard page with sidebar and main content
 */
function TrainerDashboardContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState({
    stats: mockTrainerStats,
    bookings: mockTrainerBookings,
    programs: mockTrainerPrograms
  });
  const { user } = useAuth();

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !user.trainer_profile) return;
      
      try {
        setLoading(true);
        setError(null);

        const trainerId = user.trainer_profile.id;

        // Fetch all dashboard data in parallel
        const [bookingsData, programsData, analyticsData] = await Promise.allSettled([
          bookings.getAll({ trainer_id: trainerId }),
          programs.getAll({ trainer_id: trainerId }),
          analytics.getTrainerAnalytics()
        ]);

        // Process bookings data
        let processedBookings = mockTrainerBookings;
        if (bookingsData.status === 'fulfilled' && bookingsData.value) {
          processedBookings = bookingsData.value.map((booking: any) => ({
            id: booking.id.toString(),
            clientName: booking.client?.user?.full_name || 'Client',
            clientAvatar: booking.client?.user?.avatar || 'https://i.pravatar.cc/200',
            sessionType: booking.session_type || 'Training Session',
            status: booking.status === 'confirmed' ? 'Confirmed' : 
                   booking.status === 'pending' ? 'Pending' : 
                   booking.status === 'completed' ? 'Completed' : 'Cancelled',
            datetime: booking.confirmed_date || booking.preferred_start_date,
            duration: booking.duration_minutes || 60,
            location: booking.location || 'Gym'
          }));
        }

        // Process programs data
        let processedPrograms = mockTrainerPrograms;
        if (programsData.status === 'fulfilled' && programsData.value) {
          processedPrograms = programsData.value.slice(0, 3).map((program: any) => ({
            id: program.id.toString(),
            title: program.name || 'Training Program',
            clientName: 'Multiple Clients',
            clientAvatar: 'https://i.pravatar.cc/200',
            status: program.is_active ? 'Active' : 'Completed',
            duration: `${program.duration_weeks || 12} weeks`,
            sessionsCompleted: program.workouts?.length || 0,
            totalSessions: program.duration_weeks * 2 || 24 // Assuming 2 sessions per week
          }));
        }

        // Generate dynamic stats based on real data
        const dynamicStats = [
          {
            id: '1',
            title: 'Total Clients',
            value: processedBookings.length > 0 ? 
              new Set(processedBookings.map(b => b.clientName)).size.toString() : '24',
            change: '+3 this month',
            changeType: 'increase' as const,
            icon: 'users',
            color: 'green'
          },
          {
            id: '2',
            title: 'Sessions This Week',
            value: processedBookings.filter(b => 
              b.status === 'Confirmed' || b.status === 'Pending'
            ).length.toString(),
            change: '+5 from last week',
            changeType: 'increase' as const,
            icon: 'calendar',
            color: 'blue'
          },
          {
            id: '3',
            title: 'Monthly Earnings',
            value: `$${(processedBookings.length * 85).toLocaleString()}`,
            change: '+12%',
            changeType: 'increase' as const,
            icon: 'dollar-sign',
            color: 'purple'
          },
          {
            id: '4',
            title: 'Average Rating',
            value: '4.9',
            change: 'Based on 127 reviews',
            changeType: 'increase' as const,
            icon: 'star',
            color: 'indigo'
          }
        ];

        setDashboardData({
          stats: dynamicStats,
          bookings: processedBookings,
          programs: processedPrograms
        });

      } catch (err) {
        console.error('Error fetching trainer dashboard data:', err);
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

  const upcomingBookings = dashboardData.bookings.filter(booking => 
    booking.status === 'Confirmed' || booking.status === 'Pending'
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
                  Welcome back, {user?.full_name?.split(' ')[0] || user?.username}! 💪
                </h1>
                <p className="text-indigo-100">
                  Ready to help your clients achieve their fitness goals? Let's make today great!
                </p>
              </div>
              <button className="mt-4 lg:mt-0 bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-smooth focus-ring">
                Update Availability
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
              {/* Upcoming Bookings */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Client Bookings</h2>
                <BookingManager />
              </div>

              {/* Booking Requests */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="50">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Booking Requests</h2>
                <BookingRequestManager />
              </div>

              {/* Availability Calendar */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="100">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Availability Calendar</h2>
                <AvailabilityManager />
              </div>

              {/* Optimal Schedule Finder */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="150">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Optimal Schedule Finder</h2>
                <TrainerOptimalScheduler />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Schedule Analytics */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="200">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Schedule Analytics</h2>
                <ScheduleAnalytics />
              </div>

              {/* Program Management */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="250">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Program Management</h2>
                <ProgramManager />
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="300">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-smooth focus-ring">
                    <div className="flex items-center">
                      <i data-feather="calendar" className="h-5 w-5 text-indigo-600 mr-3"></i>
                      <span className="font-medium">Schedule Session</span>
                    </div>
                  </button>
                  <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-smooth focus-ring">
                    <div className="flex items-center">
                      <i data-feather="clipboard" className="h-5 w-5 text-indigo-600 mr-3"></i>
                      <span className="font-medium">Create Program</span>
                    </div>
                  </button>
                  <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-smooth focus-ring">
                    <div className="flex items-center">
                      <i data-feather="users" className="h-5 w-5 text-indigo-600 mr-3"></i>
                      <span className="font-medium">Manage Clients</span>
                    </div>
                  </button>
                  <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-smooth focus-ring">
                    <div className="flex items-center">
                      <i data-feather="message-circle" className="h-5 w-5 text-indigo-600 mr-3"></i>
                      <span className="font-medium">Messages</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrainerDashboard() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <ProfileCompletionCheck>
        <TrainerDashboardContent />
      </ProfileCompletionCheck>
    </ProtectedRoute>
  );
}




