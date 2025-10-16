'use client';

import { User } from '../lib/data';
import FeatherIcon from './FeatherIcon';
import { useAuth } from '../contexts/AuthContext';

interface PageHeaderProps {
  user?: User | null;
  title?: string;
  subtitle?: string;
}

/**
 * Page header component with title, notifications, and user info
 */
export default function PageHeader({ user, title = 'Dashboard', subtitle = 'Track your fitness progress and manage your sessions' }: PageHeaderProps) {
  const { logout } = useAuth();
  
  // Default user values if user is null
  const displayName = user?.name || user?.full_name || 'User';
  const displayRole = user?.role || 'Member';
  const displayAvatar = user?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName) + '&background=3B82F6&color=fff';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600">{subtitle}</p>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button 
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg focus-ring transition-smooth"
              aria-label="Notifications"
            >
              <FeatherIcon name="bell" size={24} className="inline-block" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  // Fallback to default avatar if image fails to load
                  (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName) + '&background=3B82F6&color=fff';
                }}
              />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500 capitalize">{displayRole}</p>
              </div>
              
              {/* Logout Button */}
              <button 
                onClick={logout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg focus-ring transition-smooth"
                aria-label="Logout"
                title="Logout"
              >
                <FeatherIcon name="log-out" size={16} className="inline-block" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
