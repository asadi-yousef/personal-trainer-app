'use client';

import { useState, useEffect } from 'react';
import { bookingManagement } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface Booking {
  id: number;
  client_id: number;
  trainer_id: number;
  session_type: string;
  duration_minutes: number;
  location: string;
  start_time?: string;
  end_time?: string;
  confirmed_date?: string;
  status: string;
  notes?: string;
  special_requests?: string;
  client_name?: string;
  trainer_name?: string;
  other_party_name?: string;
  client?: {
    user: {
      full_name: string;
      avatar?: string;
    };
  };
}

export default function BookingManager() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const { user } = useAuth();

  // Fetch trainer's bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.trainer_profile) return;
      
      try {
        setLoading(true);
        const response = await bookingManagement.getMyBookings();
        setBookings(response?.bookings || []);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookings();
  }, [user]);

  const handleCompleteBooking = async (bookingId: number) => {
    try {
      // Mark booking as completed
      await bookingManagement.rescheduleBooking({ 
        booking_id: bookingId, 
        status: 'completed',
        notes: 'Session completed'
      });
      // Refresh bookings
      const data = await bookingManagement.getMyBookings();
      setBookings(data || []);
    } catch (error) {
      console.error('Failed to complete booking:', error);
      alert('Failed to complete booking');
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      await bookingManagement.cancelBooking({ 
        booking_id: bookingId,
        reason: 'Cancelled by trainer'
      });
      // Refresh bookings
      const data = await bookingManagement.getMyBookings();
      setBookings(data || []);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert('Failed to cancel booking');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Client Bookings</h3>
        <div className="flex space-x-2">
          {['all', 'pending', 'confirmed', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No {filter === 'all' ? '' : filter} bookings found.
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <img
                      src={booking.client?.user?.avatar || 'https://i.pravatar.cc/200'}
                      alt={booking.client?.user?.full_name || booking.client_name || booking.other_party_name || 'Client'}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {booking.client?.user?.full_name || booking.client_name || booking.other_party_name || 'Client'}
                      </h4>
                      <p className="text-sm text-gray-600">{booking.session_type}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <p className="font-medium">{booking.duration_minutes} min</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <p className="font-medium">{booking.location}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Scheduled:</span>
                      <p className="font-medium">
                        {booking.start_time && booking.end_time 
                          ? `${formatDate(booking.start_time)} at ${formatTime(booking.start_time)}`
                          : booking.confirmed_date 
                          ? formatDate(booking.confirmed_date)
                          : 'Not scheduled'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  {booking.notes && (
                    <div className="mt-2">
                      <span className="text-gray-500 text-sm">Notes:</span>
                      <p className="text-sm text-gray-700">{booking.notes}</p>
                    </div>
                  )}

                  {booking.special_requests && (
                    <div className="mt-2">
                      <span className="text-gray-500 text-sm">Special Requests:</span>
                      <p className="text-sm text-gray-700">{booking.special_requests}</p>
                    </div>
                  )}
                </div>
                
                {/* Actions based on status */}
                <div className="ml-4 flex flex-col space-y-2">
                  {booking.status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => handleCompleteBooking(booking.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Mark Complete
                      </button>
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  
                  {booking.status === 'completed' && (
                    <span className="text-sm text-green-600 font-medium">✓ Completed</span>
                  )}
                  
                  {booking.status === 'cancelled' && (
                    <span className="text-sm text-red-600 font-medium">✗ Cancelled</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Booking Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total:</span>
            <p className="font-medium">{bookings.length}</p>
          </div>
          <div>
            <span className="text-gray-500">Pending:</span>
            <p className="font-medium">{bookings.filter(b => b.status === 'pending').length}</p>
          </div>
          <div>
            <span className="text-gray-500">Confirmed:</span>
            <p className="font-medium">{bookings.filter(b => b.status === 'confirmed').length}</p>
          </div>
          <div>
            <span className="text-gray-500">Completed:</span>
            <p className="font-medium">{bookings.filter(b => b.status === 'completed').length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}







