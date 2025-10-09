'use client';

import { useEffect } from 'react';
import { StatCard as StatCardType } from '../../lib/data';
import { useFeatherIcons } from '../../utils/featherIcons';

interface StatCardProps {
  stat: StatCardType;
}

/**
 * Stat card component displaying key metrics
 */
export default function StatCard({ stat }: StatCardProps) {
  // Temporarily disable feather icons to prevent DOM conflicts
  // useFeatherIcons([stat]);

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'bg-green-100 text-green-600',
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      indigo: 'bg-indigo-100 text-indigo-600',
    };
    return colors[color as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  const getChangeIcon = (changeType?: string) => {
    return changeType === 'increase' ? 'trending-up' : 'trending-down';
  };

  const getChangeColor = (changeType?: string) => {
    return changeType === 'increase' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          {stat.change && (
            <div className="flex items-center mt-2">
              <i 
                data-feather={getChangeIcon(stat.changeType)} 
                className={`h-4 w-4 mr-1 ${getChangeColor(stat.changeType)}`}
              ></i>
              <span className={`text-sm font-medium ${getChangeColor(stat.changeType)}`}>
                {stat.change}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${getColorClasses(stat.color)}`}>
          <i data-feather={stat.icon} className="h-6 w-6"></i>
        </div>
      </div>
    </div>
  );
}
