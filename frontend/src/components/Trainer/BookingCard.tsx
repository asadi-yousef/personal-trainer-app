'use client';

import { useEffect } from 'react';
import { Booking } from '../../lib/data';

interface BookingCardProps {
  booking: Booking;
}

/**
 * Booking card component for trainer dashboard
 */
export default function BookingCard({ booking }: BookingCardProps) {
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

  const getStatusColor = (status: string) => {
    const colors = {
      'Confirmed': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-blue-100 text-blue-800',
      'Cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
    };
  };

  const { date, time } = formatDateTime(booking.datetime);

  return (
    <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-smooth">
      <img
        src={booking.clientAvatar}
        alt={booking.clientName}
        className="w-12 h-12 rounded-full mr-4"
      />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-900">{booking.clientName}</h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
            {booking.status}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-1">{booking.sessionType}</p>
        <div className="flex items-center text-sm text-gray-500">
          <i data-feather="map-pin" className="h-4 w-4 mr-1"></i>
          <span className="mr-4">{booking.location}</span>
          <i data-feather="clock" className="h-4 w-4 mr-1"></i>
          <span>{date} at {time}</span>
          <span className="ml-2">({booking.duration} min)</span>
        </div>
      </div>
      <div className="flex space-x-2">
        {booking.status === 'Pending' && (
          <button className="p-2 text-green-600 hover:bg-green-100 rounded-lg focus-ring transition-smooth">
            <i data-feather="check" className="h-4 w-4"></i>
          </button>
        )}
        <button className="p-2 text-gray-400 hover:text-gray-600 focus-ring rounded-lg transition-smooth">
          <i data-feather="more-horizontal" className="h-4 w-4"></i>
        </button>
      </div>
    </div>
  );
}












































