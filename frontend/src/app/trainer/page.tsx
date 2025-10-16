'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import PageHeader from '../../components/PageHeader';
 
import BookingRequestManager from '../../components/Trainer/BookingRequestManager';
import AvailabilityManager from '../../components/Trainer/AvailabilityManager';
import { ProtectedRoute, useAuth } from '../../contexts/AuthContext';
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
    stats: [
      {
        id: '1',
        title: 'Total Clients',
        value: '0',
        change: 'No data available',
        icon: 'users',
        color: 'green'
      },
      {
        id: '2',
        title: 'Upcoming Sessions',
        value: '0',
        change: 'No data available',
        icon: 'calendar',
        color: 'blue'
      },
      {
        id: '3',
        title: 'Completed Sessions',
        value: '0',
        change: 'No data available',
        icon: 'check-circle',
        color: 'purple'
      },
      {
        id: '4',
        title: 'Total Bookings',
        value: '0',
        change: 'No data available',
        icon: 'clipboard',
        color: 'indigo'
      }
    ],
    bookings: [],
    programs: []
  });
  const { user } = useAuth();

  // Set loading to false immediately - no API calls for stats
  useEffect(() => {
    setLoading(false);
  }, []);

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

  const upcomingBookings: any[] = [];

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
              <button onClick={() => (window.location.href = '/trainer/availability')} className="mt-4 lg:mt-0 bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-smooth focus-ring">
                Update Availability
              </button>
            </div>
          </div>

          {/* Removed Stats Cards section to avoid no-data components */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Booking Requests - Essential for trainers */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Booking Requests</h2>
                <BookingRequestManager />
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="300">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
                <div className="space-y-3">
                  <button 
                    onClick={() => window.location.href = '/trainer/clients'}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-smooth focus-ring"
                  >
                    <div className="flex items-center">
                      <i data-feather="users" className="h-5 w-5 text-indigo-600 mr-3"></i>
                      <span className="font-medium">View My Clients</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => window.location.href = '/trainer/bookings'}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-smooth focus-ring"
                  >
                    <div className="flex items-center">
                      <i data-feather="calendar" className="h-5 w-5 text-indigo-600 mr-3"></i>
                      <span className="font-medium">Manage Bookings</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => window.location.href = '/trainer/messages'}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-smooth focus-ring"
                  >
                    <div className="flex items-center">
                      <i data-feather="message-circle" className="h-5 w-5 text-indigo-600 mr-3"></i>
                      <span className="font-medium">Messages</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Upcoming Sessions */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="350">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Sessions</h2>
                <div className="space-y-4">
                  {upcomingBookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{booking.clientName}</p>
                          <p className="text-sm text-gray-600">{booking.sessionType}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{booking.datetime}</p>
                          <p className="text-xs text-gray-500">{booking.duration} min</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {upcomingBookings.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <i data-feather="clock" className="h-12 w-12 mx-auto mb-2"></i>
                      <p>No upcoming sessions</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="400">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <i data-feather="check-circle" className="h-4 w-4 text-green-600"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Session completed</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <i data-feather="user-plus" className="h-4 w-4 text-blue-600"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">New client booked</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <i data-feather="message-circle" className="h-4 w-4 text-purple-600"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">New message received</p>
                      <p className="text-xs text-gray-500">3 days ago</p>
                    </div>
                  </div>
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


