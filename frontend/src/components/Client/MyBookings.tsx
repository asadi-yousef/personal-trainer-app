'use client';

import { useState, useEffect } from 'react';
import { bookingManagement, bookingRequests, payments } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import PaymentForm from './PaymentForm';

interface Booking {
  id: number;
  other_party_name: string;
  session_type: string;
  duration_minutes: number;
  location: string;
  start_time?: string;
  end_time?: string;
  total_cost?: number;
  status: string;
  special_requests?: string;
  created_at: string;
  can_cancel: boolean;
  can_reschedule: boolean;
  has_payment?: boolean;
  preferred_start_date?: string;
  preferred_end_date?: string;
}

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Helper function to get today's datetime in YYYY-MM-DDTHH:MM format
  const getTodayDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Cancellation form state
  const [cancellationReason, setCancellationReason] = useState('');


  // Payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingToPay, setBookingToPay] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Fetch both confirmed bookings and pending booking requests
      const [bookingsResponse, requestsResponse] = await Promise.allSettled([
        bookingManagement.getMyBookings(),
        bookingManagement.getMyBookingRequests()
      ]);
      
      let allBookings: Booking[] = [];
      
      // Add confirmed bookings
      if (bookingsResponse.status === 'fulfilled' && bookingsResponse.value?.bookings) {
        console.log('DEBUG: Confirmed bookings data:', bookingsResponse.value.bookings);
        allBookings = [...bookingsResponse.value.bookings];
      }
      
      // Add pending booking requests
      if (requestsResponse.status === 'fulfilled' && requestsResponse.value) {
        const pendingRequests = Array.isArray((requestsResponse.value as any)?.booking_requests)
          ? (requestsResponse.value as any).booking_requests
          : (Array.isArray(requestsResponse.value) ? (requestsResponse.value as any) : (requestsResponse.value as any)?.requests || (requestsResponse.value as any)?.data || []);

        // Helpers for future-only filter (local midnight safe)
        const getTodayMidnight = () => {
          const now = new Date();
          return new Date(now.getFullYear(), now.getMonth(), now.getDate());
        };
        const todayMidnight = getTodayMidnight().getTime();
        const isFuture = (req: any) => {
          const primary = req.preferred_start_date || req.start_time;
          const fallback = req.expires_at;
          const pick = primary || fallback;
          if (!pick) return true; // keep undated
          const d = new Date(pick);
          if (isNaN(d.getTime())) return true; // keep unparsable
          const reqMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
          return reqMidnight >= todayMidnight;
        };

        const formattedRequests = pendingRequests
          .filter((request: any) => String(request.status).toLowerCase() === 'pending' && isFuture(request))
          .map((request: any) => ({
            id: request.id,
            other_party_name: request.trainer?.user?.full_name || request.trainer_name || 'Trainer',
            session_type: request.session_type || 'Training Session',
            duration_minutes: request.duration_minutes || 60,
            location: request.location || 'Gym',
            status: 'pending',
            special_requests: request.special_requests || '',
            created_at: request.created_at || new Date().toISOString(),
            can_cancel: true,
            can_reschedule: false,
            preferred_start_date: request.preferred_start_date,
            preferred_end_date: request.preferred_end_date
          }));
          
        allBookings = [...allBookings, ...formattedRequests];
      }
      
      setBookings(allBookings);
    } catch (err: any) {
      console.error('Failed to fetch bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedBooking || !cancellationReason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      console.log('DEBUG: Cancelling booking:', {
        id: selectedBooking.id,
        status: selectedBooking.status,
        type: selectedBooking.status === 'pending' ? 'booking request' : 'confirmed booking'
      });

      // Handle cancellation based on booking status
      if (selectedBooking.status === 'pending') {
        // Cancel booking request
        console.log('DEBUG: Calling cancelBookingRequest for ID:', selectedBooking.id);
        console.log('DEBUG: User auth state:', { user: user?.id, role: user?.role });
        console.log('DEBUG: Token in localStorage:', localStorage.getItem('access_token') ? 'Present' : 'Missing');
        await bookingRequests.cancel(selectedBooking.id);
        console.log('DEBUG: Booking request cancelled successfully');
      } else {
        // Cancel confirmed booking
        console.log('DEBUG: Calling cancelBooking for ID:', selectedBooking.id);
        await bookingManagement.cancelBooking({
          booking_id: selectedBooking.id,
          cancellation_reason: cancellationReason
        });
        console.log('DEBUG: Confirmed booking cancelled successfully');
      }

      // Update the booking status in the list
      setBookings(prev => prev.map(booking => 
        booking.id === selectedBooking.id 
          ? { ...booking, status: 'cancelled', can_cancel: false, can_reschedule: false }
          : booking
      ));
      
      setSelectedBooking(null);
      setCancellationReason('');
      
      console.log('DEBUG: Booking cancelled and UI updated');
      
    } catch (err: any) {
      console.error('Failed to cancel booking:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        response: err.response
      });
      setError(err.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };


  const handlePayNow = (booking: Booking) => {
    console.log('DEBUG: Booking data for payment:', {
      id: booking.id,
      total_cost: booking.total_cost,
      session_type: booking.session_type,
      duration_minutes: booking.duration_minutes
    });
    setBookingToPay(booking);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setBookingToPay(null);
    
    // Mark the booking as paid
    if (bookingToPay) {
      setBookings(prev => prev.map(booking => 
        booking.id === bookingToPay.id 
          ? { ...booking, has_payment: true }
          : booking
      ));
    }
    
    // Refresh bookings to get updated data
    fetchBookings();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status.toLowerCase() === filter;
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
        <div className="flex space-x-2">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-3 py-1 text-sm rounded-full capitalize ${
                filter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? "You don't have any bookings yet. Start by browsing trainers and requesting a session."
              : `You don't have any ${filter} bookings.`
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredBookings.map((booking, index) => (
            <div
              key={`${booking.id}-${booking.start_time}-${index}`}
              className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.other_party_name}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Session:</span> {booking.session_type}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Duration:</span> {booking.duration_minutes} minutes
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Location:</span> {booking.location}
                      </p>
                    </div>
                    <div>
                      {booking.start_time && booking.end_time ? (
                        <>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Date:</span> {formatDate(booking.start_time)}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Time:</span> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                          </p>
                        </>
                      ) : booking.preferred_start_date ? (
                        <>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Requested Date:</span> {formatDate(booking.preferred_start_date)}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Status:</span> Awaiting trainer confirmation
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Status:</span> Awaiting confirmation
                        </p>
                      )}
                    </div>
                  </div>

                  {booking.special_requests && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Special Requests:</span> {booking.special_requests}
                      </p>
                    </div>
                  )}

                  <div className="text-sm text-gray-500">
                    Booked: {formatDate(booking.created_at)}
                  </div>
                </div>

                <div className="ml-6 flex flex-col space-y-2">
                  {booking.can_cancel && (
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                    >
                      Cancel
                    </button>
                  )}
                  {booking.status.toLowerCase() === 'confirmed' && !booking.has_payment && (
                    <button
                      onClick={() => handlePayNow(booking)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                    >
                      Pay Now
                    </button>
                  )}
                  {booking.has_payment && (
                    <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                      ✓ Paid
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Cancel Booking
              </h3>

              <div className="space-y-4">
                {/* Booking Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Booking Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Trainer:</span> {selectedBooking.other_party_name}</div>
                    <div><span className="font-medium">Session:</span> {selectedBooking.session_type}</div>
                    <div><span className="font-medium">Duration:</span> {selectedBooking.duration_minutes} min</div>
                    <div><span className="font-medium">Location:</span> {selectedBooking.location}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Cancellation
                  </label>
                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Please provide a reason for cancelling this booking..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading || !cancellationReason.trim()}
                    className="flex-1 px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700"
                  >
                    {actionLoading ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && bookingToPay && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 w-11/12 md:w-3/4 lg:w-2/3 max-w-4xl">
            <div className="relative">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 bg-white rounded-full p-2"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <PaymentForm
                booking={{
                  id: bookingToPay.id,
                  session_type: bookingToPay.session_type,
                  duration_minutes: bookingToPay.duration_minutes,
                  total_cost: bookingToPay.total_cost || 0,
                  trainer_name: bookingToPay.other_party_name,
                  scheduled_date: bookingToPay.start_time
                }}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowPaymentModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


