'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useFeatherIcons } from '../utils/featherIcons';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/**
 * Collapsible sidebar component for client dashboard
 */
export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Temporarily disable feather icons to prevent DOM conflicts
  // useFeatherIcons([collapsed, pathname]);

  // Get current route to determine which sidebar to show
  const isClientRoute = pathname.startsWith('/client');
  const isTrainerRoute = pathname.startsWith('/trainer');
  const isAdminRoute = pathname.startsWith('/admin');

  const sidebarItems = isClientRoute ? [
    {
      title: 'Main',
      items: [
        { icon: 'home', label: 'Dashboard', href: '/client' },
        { icon: 'zap', label: 'Smart Scheduling', href: '/client/schedule' },
        { icon: 'calendar', label: 'My Schedule', href: '/client/calendar' },
        { icon: 'clipboard', label: 'Workout Plans', href: '/client/plans' },
        { icon: 'trending-up', label: 'Progress', href: '/client/progress' },
        { icon: 'message-square', label: 'Messages', href: '/client/messages' },
        { icon: 'user', label: 'My Trainer', href: '/client/trainer' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { icon: 'settings', label: 'Account Settings', href: '/client/settings' },
        { icon: 'help-circle', label: 'Help & Support', href: '/client/help' },
      ],
    },
  ] : isTrainerRoute ? [
    {
      title: 'Main',
      items: [
        { icon: 'home', label: 'Dashboard', href: '/trainer' },
        { icon: 'zap', label: 'Schedule Optimization', href: '/trainer/schedule' },
        { icon: 'calendar', label: 'Bookings', href: '/trainer/bookings' },
        { icon: 'clock', label: 'Availability', href: '/trainer/availability' },
        { icon: 'clipboard', label: 'Programs', href: '/trainer/programs' },
        { icon: 'users', label: 'Clients', href: '/trainer/clients' },
        { icon: 'trending-up', label: 'Analytics', href: '/trainer/analytics' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { icon: 'settings', label: 'Account Settings', href: '/trainer/settings' },
        { icon: 'help-circle', label: 'Help & Support', href: '/trainer/help' },
      ],
    },
  ] : isAdminRoute ? [
    {
      title: 'Main',
      items: [
        { icon: 'home', label: 'Dashboard', href: '/admin' },
        { icon: 'users', label: 'User Management', href: '/admin/users' },
        { icon: 'user-check', label: 'Trainers', href: '/admin/trainers' },
        { icon: 'bar-chart', label: 'Analytics', href: '/admin/analytics' },
        { icon: 'settings', label: 'System Settings', href: '/admin/settings' },
      ],
    },
    {
      title: 'System',
      items: [
        { icon: 'activity', label: 'System Status', href: '/admin/status' },
        { icon: 'shield', label: 'Security', href: '/admin/security' },
        { icon: 'mail', label: 'Notifications', href: '/admin/notifications' },
        { icon: 'help-circle', label: 'Support', href: '/admin/support' },
      ],
    },
  ] : [];

  const isActive = (href: string) => {
    if (href === '/client') return pathname === '/client';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`sidebar fixed left-0 top-0 h-full bg-white shadow-lg z-40 ${
        collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'
      }`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <i data-feather="activity" className="h-8 w-8 text-indigo-600"></i>
          {!collapsed && (
            <span className="ml-2 text-xl font-bold text-gray-900">FitConnect</span>
          )}
        </div>
      </div>

      {/* User Profile */}
      {user && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <img
              src={user.avatar || 'https://i.pravatar.cc/200'}
              alt={user.full_name || user.username}
              className="w-10 h-10 rounded-full"
            />
            {!collapsed && (
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user.full_name?.split(' ')[0] || user.username}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {sidebarItems.map((section) => (
          <div key={section.title} className="mb-6">
            {!collapsed && (
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium transition-smooth focus-ring ${
                      isActive(item.href)
                        ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <i data-feather={item.icon} className="h-5 w-5 flex-shrink-0"></i>
                    {!collapsed && <span className="ml-3">{item.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Toggle Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 focus-ring transition-smooth"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i data-feather={collapsed ? 'chevron-right' : 'chevron-left'} className="h-4 w-4"></i>
          {!collapsed && <span className="ml-2">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
