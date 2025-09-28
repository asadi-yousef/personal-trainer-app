'use client';

import { useEffect } from 'react';

/**
 * Analytics chart component for admin dashboard
 */
export default function AnalyticsChart() {
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
          <select className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
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
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">1,247</div>
          <div className="text-sm text-blue-600">Total Users</div>
          <div className="text-xs text-green-600 mt-1">+12% this month</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">156</div>
          <div className="text-sm text-green-600">Active Trainers</div>
          <div className="text-xs text-green-600 mt-1">+8% this month</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">$45K</div>
          <div className="text-sm text-purple-600">Monthly Revenue</div>
          <div className="text-xs text-green-600 mt-1">+18% this month</div>
        </div>
        <div className="text-center p-4 bg-indigo-50 rounded-lg">
          <div className="text-2xl font-bold text-indigo-600">4.8</div>
          <div className="text-sm text-indigo-600">Avg Rating</div>
          <div className="text-xs text-green-600 mt-1">+0.2 this month</div>
        </div>
      </div>
    </div>
  );
}





