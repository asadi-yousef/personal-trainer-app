'use client';

import { useState, useEffect } from 'react';
import { analytics } from '../../lib/api';

/**
 * Recent activity component for admin dashboard
 */
export default function RecentActivity() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        // For now, we'll create mock activities from real data
        // In a real app, you'd have an activities endpoint
        const [realtimeData] = await Promise.allSettled([
          analytics.getRealtime()
        ]);
        
        // Generate activities from realtime data
        const mockActivities = [
          {
            id: '1',
            type: 'user_signup',
            user: 'Recent User',
            action: 'signed up',
            time: 'Just now',
            icon: 'user-plus',
            color: 'text-green-600'
          },
          {
            id: '2',
            type: 'session_booked',
            user: 'Client',
            action: 'booked a session',
            time: 'Recently',
            icon: 'calendar',
            color: 'text-blue-600'
          },
          {
            id: '3',
            type: 'trainer_joined',
            user: 'New Trainer',
            action: 'joined as trainer',
            time: 'Recently',
            icon: 'user-check',
            color: 'text-purple-600'
          }
        ];
        
        setActivities(mockActivities);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, []);

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
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium focus-ring rounded-md p-1">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No recent activity
          </div>
        ) : (
          activities.map((activity) => (
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
          ))
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium focus-ring rounded-md p-2">
          Load More Activity
        </button>
      </div>
    </div>
  );
}





