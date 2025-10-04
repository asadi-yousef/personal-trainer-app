'use client';

import { useState, useEffect } from 'react';

/**
 * Schedule analytics component for trainers
 */
export default function ScheduleAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('utilization');

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

  const periods = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'quarter', label: 'This Quarter' },
    { id: 'year', label: 'This Year' }
  ];

  const metrics = [
    { id: 'utilization', label: 'Utilization Rate', icon: 'trending-up' },
    { id: 'client_satisfaction', label: 'Client Satisfaction', icon: 'heart' },
    { id: 'revenue', label: 'Revenue', icon: 'dollar-sign' },
    { id: 'efficiency', label: 'Schedule Efficiency', icon: 'zap' }
  ];

  // Mock analytics data
  const getAnalyticsData = (period: string, metric: string) => {
    const data = {
      week: {
        utilization: { value: 85, change: +12, trend: 'up' },
        client_satisfaction: { value: 4.8, change: +0.3, trend: 'up' },
        revenue: { value: 2400, change: +15, trend: 'up' },
        efficiency: { value: 92, change: +8, trend: 'up' }
      },
      month: {
        utilization: { value: 78, change: +5, trend: 'up' },
        client_satisfaction: { value: 4.7, change: +0.1, trend: 'up' },
        revenue: { value: 9600, change: +12, trend: 'up' },
        efficiency: { value: 88, change: +6, trend: 'up' }
      }
    };
    
    return data[period as keyof typeof data]?.[metric as keyof typeof data.week] || { value: 0, change: 0, trend: 'stable' };
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'minus';
    }
  };

  return (
    <div className="space-y-8">
      {/* Period and Metric Selection */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Period
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {periods.map(period => (
              <option key={period.id} value={period.id}>{period.label}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Focus Metric
          </label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {metrics.map(metric => (
              <option key={metric.id} value={metric.id}>{metric.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const data = getAnalyticsData(selectedPeriod, metric.id);
          return (
            <div key={metric.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metric.id === 'revenue' ? `$${data.value}` : 
                     metric.id === 'client_satisfaction' ? data.value : 
                     `${data.value}%`}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  metric.id === 'utilization' ? 'bg-indigo-100' :
                  metric.id === 'client_satisfaction' ? 'bg-green-100' :
                  metric.id === 'revenue' ? 'bg-yellow-100' : 'bg-purple-100'
                }`}>
                  <i data-feather={metric.icon} className={`h-6 w-6 ${
                    metric.id === 'utilization' ? 'text-indigo-600' :
                    metric.id === 'client_satisfaction' ? 'text-green-600' :
                    metric.id === 'revenue' ? 'text-yellow-600' : 'text-purple-600'
                  }`}></i>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <i data-feather={getTrendIcon(data.trend)} className={`h-4 w-4 mr-1 ${getTrendColor(data.trend)}`}></i>
                <span className={`text-sm font-medium ${getTrendColor(data.trend)}`}>
                  {data.change > 0 ? '+' : ''}{data.change}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last {selectedPeriod}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule Efficiency Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <i data-feather="bar-chart" className="h-5 w-5 mr-2 text-indigo-600"></i>
          Schedule Efficiency Over Time
        </h3>
        
        {/* Mock chart - in real app this would be a chart library */}
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <i data-feather="bar-chart" className="h-12 w-12 text-gray-400 mx-auto mb-4"></i>
            <p className="text-gray-600">Schedule efficiency chart would be displayed here</p>
            <p className="text-sm text-gray-500">Integration with Chart.js or similar library</p>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Peak Hours Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i data-feather="clock" className="h-5 w-5 mr-2 text-indigo-600"></i>
            Peak Hours Analysis
          </h3>
          
          <div className="space-y-4">
            {[
              { time: '9:00 AM - 10:00 AM', utilization: 95, sessions: 8 },
              { time: '10:00 AM - 11:00 AM', utilization: 92, sessions: 7 },
              { time: '5:00 PM - 6:00 PM', utilization: 88, sessions: 6 },
              { time: '6:00 PM - 7:00 PM', utilization: 85, sessions: 5 },
              { time: '11:00 AM - 12:00 PM', utilization: 78, sessions: 4 }
            ].map((slot, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{slot.time}</div>
                  <div className="text-sm text-gray-600">{slot.sessions} sessions</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{slot.utilization}%</div>
                  <div className="text-sm text-gray-600">utilization</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Client Satisfaction Trends */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i data-feather="heart" className="h-5 w-5 mr-2 text-indigo-600"></i>
            Client Satisfaction Trends
          </h3>
          
          <div className="space-y-4">
            {[
              { client: 'John Smith', rating: 4.9, sessions: 24, trend: 'up' },
              { client: 'Sarah Johnson', rating: 4.8, sessions: 18, trend: 'stable' },
              { client: 'Mike Chen', rating: 4.7, sessions: 32, trend: 'up' },
              { client: 'Emma Wilson', rating: 4.6, sessions: 15, trend: 'down' },
              { client: 'David Brown', rating: 4.9, sessions: 28, trend: 'up' }
            ].map((client, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600">
                      {client.client.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{client.client}</div>
                    <div className="text-sm text-gray-600">{client.sessions} sessions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    <div className="font-semibold text-gray-900 mr-2">{client.rating}</div>
                    <i data-feather={getTrendIcon(client.trend)} className={`h-4 w-4 ${getTrendColor(client.trend)}`}></i>
                  </div>
                  <div className="text-sm text-gray-600">rating</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Optimization Recommendations */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-feather="lightbulb" className="h-5 w-5 mr-2 text-indigo-600"></i>
          Optimization Recommendations
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Schedule Gaps</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Consider filling 2:00 PM - 4:00 PM slots</li>
              <li>• Add weekend sessions for 15% revenue increase</li>
              <li>• Optimize travel time between locations</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Client Opportunities</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Emma Wilson may benefit from schedule adjustment</li>
              <li>• Consider group sessions for similar fitness levels</li>
              <li>• Implement client feedback system for better satisfaction</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}









