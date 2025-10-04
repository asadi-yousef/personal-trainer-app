'use client';

import { useState, useEffect } from 'react';
import { analytics } from '../../lib/api';

/**
 * Analytics chart component for admin dashboard
 */
export default function AnalyticsChart() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7');

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [overviewData, realtimeData] = await Promise.allSettled([
          analytics.getOverview(),
          analytics.getRealtime()
        ]);
        
        const data = {
          overview: overviewData.status === 'fulfilled' ? overviewData.value : null,
          realtime: realtimeData.status === 'fulfilled' ? realtimeData.value : null
        };
        
        setAnalyticsData(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        setAnalyticsData(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [selectedPeriod]);

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
        <h3 className="text-lg font-semibold text-gray-900">Platform Analytics</h3>
        <div className="flex space-x-2">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center mb-6">
        <div className="text-center">
          <i data-feather="bar-chart-2" className="h-12 w-12 text-gray-400 mx-auto mb-4"></i>
          <p className="text-gray-600">Analytics chart will be displayed here</p>
          <p className="text-sm text-gray-500 mt-2">Connect your analytics service to see detailed metrics</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center p-4 bg-gray-50 rounded-lg animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </>
        ) : analyticsData?.overview ? (
          <>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analyticsData.overview.total_users || 0}
              </div>
              <div className="text-sm text-blue-600">Total Users</div>
              <div className="text-xs text-green-600 mt-1">
                +{analyticsData.overview.user_growth_percentage || 0}% this month
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analyticsData.overview.total_trainers || 0}
              </div>
              <div className="text-sm text-green-600">Active Trainers</div>
              <div className="text-xs text-green-600 mt-1">
                +{analyticsData.overview.trainer_growth_percentage || 0}% this month
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                ${analyticsData.overview.monthly_revenue || 0}K
              </div>
              <div className="text-sm text-purple-600">Monthly Revenue</div>
              <div className="text-xs text-green-600 mt-1">
                +{analyticsData.overview.revenue_growth_percentage || 0}% this month
              </div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">
                {analyticsData.overview.average_rating || 0}
              </div>
              <div className="text-sm text-indigo-600">Avg Rating</div>
              <div className="text-xs text-green-600 mt-1">
                +{analyticsData.overview.rating_improvement || 0} this month
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-blue-600">Total Users</div>
              <div className="text-xs text-gray-500 mt-1">No data available</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-green-600">Active Trainers</div>
              <div className="text-xs text-gray-500 mt-1">No data available</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">$0K</div>
              <div className="text-sm text-purple-600">Monthly Revenue</div>
              <div className="text-xs text-gray-500 mt-1">No data available</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">0</div>
              <div className="text-sm text-indigo-600">Avg Rating</div>
              <div className="text-xs text-gray-500 mt-1">No data available</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}





