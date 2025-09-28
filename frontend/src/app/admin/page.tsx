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

/**
 * Admin dashboard page with user management and analytics
 */
function AdminDashboardContent() {
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {mockAdminStats.map((stat, index) => (
              <div key={stat.id} data-aos="fade-up" data-aos-delay={index * 100}>
                <StatCard stat={stat} />
              </div>
            ))}
          </div>

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
            <UserTable users={mockUsers} />
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




