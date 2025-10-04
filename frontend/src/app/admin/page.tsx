'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/Cards/StatCard';
import UserTable from '../../components/Admin/UserTable';
import AnalyticsChart from '../../components/Admin/AnalyticsChart';
import RecentActivity from '../../components/Admin/RecentActivity';
import { mockAdminStats, mockUsers } from '../../lib/data';
import { ProtectedRoute, useAuth } from '../../contexts/AuthContext';
import { apiClient, analytics, trainers } from '../../lib/api';

/**
 * Admin dashboard page with user management and analytics
 */
function AdminDashboardContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState({
    stats: mockAdminStats,
    users: mockUsers,
    analytics: null
  });
  const { user } = useAuth();

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);

        // Fetch all dashboard data in parallel
        const [analyticsData, trainersData] = await Promise.allSettled([
          analytics.getOverview(),
          trainers.getAll()
        ]);

        // Process analytics data
        let processedAnalytics = null;
        if (analyticsData.status === 'fulfilled' && analyticsData.value) {
          processedAnalytics = analyticsData.value;
          
          // Generate dynamic stats based on real analytics
          const dynamicStats = [
            {
              id: '1',
              title: 'Total Users',
              value: processedAnalytics.metrics?.total_users?.toString() || '1,247',
              change: '+89 this month',
              changeType: 'increase' as const,
              icon: 'users',
              color: 'green'
            },
            {
              id: '2',
              title: 'Active Trainers',
              value: processedAnalytics.metrics?.total_trainers?.toString() || '156',
              change: '+12 new trainers',
              changeType: 'increase' as const,
              icon: 'user-check',
              color: 'blue'
            },
            {
              id: '3',
              title: 'Monthly Revenue',
              value: processedAnalytics.metrics?.total_revenue ? 
                `$${processedAnalytics.metrics.total_revenue.toLocaleString()}` : '$45,230',
              change: '+18% from last month',
              changeType: 'increase' as const,
              icon: 'dollar-sign',
              color: 'purple'
            },
            {
              id: '4',
              title: 'Platform Uptime',
              value: '99.9%',
              change: 'Last 30 days',
              changeType: 'increase' as const,
              icon: 'activity',
              color: 'indigo'
            }
          ];

          setDashboardData(prev => ({
            ...prev,
            stats: dynamicStats,
            analytics: processedAnalytics
          }));
        }

      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
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
                  Admin Dashboard 👑
                </h1>
                <p className="text-indigo-100">
                  Monitor and manage your FitConnect platform. Keep everything running smoothly.
                </p>
              </div>
              <button className="mt-4 lg:mt-0 bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-smooth focus-ring">
                Generate Report
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Analytics Chart */}
            <div className="lg:col-span-2" data-aos="fade-up">
              <AnalyticsChart />
            </div>

            {/* Recent Activity */}
            <div data-aos="fade-up" data-aos-delay="100">
              <RecentActivity />
            </div>
          </div>

          {/* User Management */}
          <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <div className="flex space-x-3">
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus-ring transition-smooth">
                  Add User
                </button>
                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 focus-ring transition-smooth">
                  Export Data
                </button>
              </div>
            </div>
            <UserTable users={dashboardData.users} />
          </div>

          {/* Platform Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">API Status</span>
                  <span className="flex items-center text-green-600">
                    <i data-feather="check-circle" className="h-4 w-4 mr-1"></i>
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Database</span>
                  <span className="flex items-center text-green-600">
                    <i data-feather="check-circle" className="h-4 w-4 mr-1"></i>
                    Healthy
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment System</span>
                  <span className="flex items-center text-green-600">
                    <i data-feather="check-circle" className="h-4 w-4 mr-1"></i>
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Email Service</span>
                  <span className="flex items-center text-yellow-600">
                    <i data-feather="alert-triangle" className="h-4 w-4 mr-1"></i>
                    Warning
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="400">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-smooth focus-ring">
                  <div className="flex items-center">
                    <i data-feather="users" className="h-5 w-5 text-indigo-600 mr-3"></i>
                    <span className="font-medium">Manage Users</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-smooth focus-ring">
                  <div className="flex items-center">
                    <i data-feather="settings" className="h-5 w-5 text-indigo-600 mr-3"></i>
                    <span className="font-medium">System Settings</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-smooth focus-ring">
                  <div className="flex items-center">
                    <i data-feather="bar-chart" className="h-5 w-5 text-indigo-600 mr-3"></i>
                    <span className="font-medium">View Analytics</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-smooth focus-ring">
                  <div className="flex items-center">
                    <i data-feather="mail" className="h-5 w-5 text-indigo-600 mr-3"></i>
                    <span className="font-medium">Send Notifications</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}




