'use client';

import React from 'react';
import Link from 'next/link';
import { useAdmin } from '@/contexts/AdminContext';
import { useRouter } from 'next/navigation';

export default function AdminNavbar() {
  const { admin, logout } = useAdmin();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">FitConnect Admin</h1>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex space-x-6">
              <Link href="/admin/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">
                Dashboard
              </Link>
              <Link href="/admin/users" className="text-gray-700 hover:text-blue-600 font-medium">
                Users
              </Link>
              <Link href="/admin/trainers" className="text-gray-700 hover:text-blue-600 font-medium">
                Trainers
              </Link>
              <Link href="/admin/bookings" className="text-gray-700 hover:text-blue-600 font-medium">
                Bookings
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome, {admin?.username}
              </span>
              <span className="text-xs text-gray-400">
                ({admin?.admin_level})
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
