'use client';

import { useState, useEffect } from 'react';
import { bookingManagement } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface BookingStats {
  total_bookings: number;
  confirmed_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  pending_requests: number;
  total_revenue: number;
  average_session_duration: number;
  most_popular_times: { time: string; count: number }[];
  client_satisfaction: number;
}

export default function ScheduleAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.trainer_profile?.id) return;
      
      try {
        setLoading(true);
        // For now, we'll use mock data since we don't have a dedicated analytics endpoint
        // In a real app, you'd call: const data = await analytics.getTrainerAnalytics(timeRange);
        
        // Mock data based on typical trainer metrics
        const mockStats: BookingStats = {
          total_bookings: 45,
          confirmed_bookings: 38,
          completed_bookings: 32,
          cancelled_bookings: 3,
          pending_requests: 7,
          total_revenue: 4250,
          average_session_duration: 67,
          most_popular_times: [
            { time: '10:00 AM', count: 12 },
            { time: '6:00 PM', count: 10 },
            { time: '7:00 AM', count: 8 },
            { time: '5:00 PM', count: 7 },
            { time: '11:00 AM', count: 5 }
          ],
          client_satisfaction: 4.8
        };
        
        setStats(mockStats);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, timeRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-500">
        <i data-feather="bar-chart" className="h-12 w-12 mx-auto mb-4 text-gray-300"></i>
        <p>No analytics data available.</p>
      </div>
    );
  }

  const completionRate = stats.total_bookings > 0 ? 
    Math.round((stats.completed_bookings / stats.total_bookings) * 100) : 0;
  
  const cancellationRate = stats.total_bookings > 0 ? 
    Math.round((stats.cancelled_bookings / stats.total_bookings) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <i data-feather="bar-chart" className="h-5 w-5 mr-2 text-indigo-600"></i>
          Schedule Analytics
        </h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter')}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <i data-feather="calendar" className="h-8 w-8 text-blue-600"></i>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total Bookings</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total_bookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <i data-feather="check-circle" className="h-8 w-8 text-green-600"></i>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Completion Rate</p>
              <p className="text-2xl font-bold text-green-900">{completionRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <i data-feather="dollar-sign" className="h-8 w-8 text-purple-600"></i>
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">Revenue</p>
              <p className="text-2xl font-bold text-purple-900">${stats.total_revenue}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center">
            <i data-feather="star" className="h-8 w-8 text-yellow-600"></i>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-600">Satisfaction</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.client_satisfaction}/5</p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Status Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Booking Status Breakdown</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.confirmed_bookings}</div>
            <div className="text-sm text-gray-600">Confirmed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.completed_bookings}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending_requests}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled_bookings}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </div>
        </div>
        
        {/* Cancellation Rate Warning */}
        {cancellationRate > 10 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <i data-feather="alert-triangle" className="h-5 w-5 text-red-400 mr-2"></i>
              <span className="text-sm text-red-700">
                High cancellation rate ({cancellationRate}%). Consider reviewing your scheduling flexibility.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Popular Times */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Most Popular Session Times</h4>
        <div className="space-y-3">
          {stats.most_popular_times.map((timeSlot, index) => (
            <div key={timeSlot.time} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  {index + 1}
                </div>
                <span className="font-medium text-gray-900">{timeSlot.time}</span>
              </div>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full" 
                    style={{ width: `${(timeSlot.count / stats.most_popular_times[0].count) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8 text-right">{timeSlot.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h4 className="font-medium text-indigo-900 mb-3 flex items-center">
          <i data-feather="lightbulb" className="h-5 w-5 mr-2"></i>
          Insights & Recommendations
        </h4>
        <div className="space-y-2 text-sm text-indigo-800">
          <p>• Your most popular time is {stats.most_popular_times[0].time} with {stats.most_popular_times[0].count} sessions</p>
          <p>• Average session duration is {stats.average_session_duration} minutes</p>
          <p>• Consider adding more availability during peak hours to maximize bookings</p>
          {completionRate > 90 && (
            <p>• Excellent completion rate! Your clients are very satisfied with your sessions</p>
          )}
        </div>
      </div>
    </div>
  );
}