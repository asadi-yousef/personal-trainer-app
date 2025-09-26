'use client';

import { useEffect } from 'react';

/**
 * Recent activity component for admin dashboard
 */
export default function RecentActivity() {
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

  const activities = [
    {
      id: '1',
      type: 'user_signup',
      user: 'John Doe',
      action: 'signed up',
      time: '2 minutes ago',
      icon: 'user-plus',
      color: 'text-green-600'
    },
    {
      id: '2',
      type: 'session_booked',
      user: 'Emma Wilson',
      action: 'booked a session',
      time: '15 minutes ago',
      icon: 'calendar',
      color: 'text-blue-600'
    },
    {
      id: '3',
      type: 'trainer_joined',
      user: 'Mike Chen',
      action: 'joined as trainer',
      time: '1 hour ago',
      icon: 'user-check',
      color: 'text-purple-600'
    },
    {
      id: '4',
      type: 'payment_completed',
      user: 'Sarah Johnson',
      action: 'completed payment',
      time: '2 hours ago',
      icon: 'credit-card',
      color: 'text-green-600'
    },
    {
      id: '5',
      type: 'program_created',
      user: 'David Thompson',
      action: 'created new program',
      time: '3 hours ago',
      icon: 'clipboard',
      color: 'text-indigo-600'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium focus-ring rounded-md p-1">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center`}>
              <i data-feather={activity.icon} className={`h-4 w-4 ${activity.color}`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{activity.user}</span>{' '}
                {activity.action}
              </p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium focus-ring rounded-md p-2">
          Load More Activity
        </button>
      </div>
    </div>
  );
}



