'use client';

import { useEffect } from 'react';
import { User } from '../lib/data';

interface PageHeaderProps {
  user: User;
}

/**
 * Page header component with title, notifications, and user info
 */
export default function PageHeader({ user }: PageHeaderProps) {
  useEffect(() => {
    const loadFeatherIcons = async () => {
      try {
        const feather = (await import('feather-icons')).default;
        feather.replace();
      } catch (error) {
        console.error('Failed to load feather icons:', error);
      }
    };
    loadFeatherIcons();
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Track your fitness progress and manage your sessions</p>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg focus-ring transition-smooth">
              <i data-feather="bell" className="h-6 w-6"></i>
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <button className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg focus-ring transition-smooth">
                <i data-feather="chevron-down" className="h-4 w-4"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
