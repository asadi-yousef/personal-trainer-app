'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { getDashboardStats, DashboardStats } from '@/lib/admin-api';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { admin, token, logout } = useAdmin();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/admin/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const data = await getDashboardStats(token);
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard stats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [token, router]);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back, {admin?.username}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Level: {admin?.admin_level}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Total Users */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">👥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.users.total || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Trainers */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🏋️</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Trainers
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.users.trainers || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Bookings */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📅</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Bookings
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.bookings.total || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                onClick={() => router.push('/admin/users')}
                className="flex items-center p-4 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-blue-600 text-lg">👥</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">Manage Users</p>
                  <p className="text-sm text-gray-500">View and manage all users</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/admin/trainers')}
                className="flex items-center p-4 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-green-600 text-lg">🏋️</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">Manage Trainers</p>
                  <p className="text-sm text-gray-500">Review trainer profiles</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/admin/bookings')}
                className="flex items-center p-4 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-yellow-600 text-lg">📅</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">View Bookings</p>
                  <p className="text-sm text-gray-500">Monitor all bookings</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
