'use client';

import { useState, useEffect } from 'react';
import { bookingRequests, bookingManagement } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface BookingRequest {
  id: number;
  client_name: string;
  client_email?: string;
  session_type: string;
  duration_minutes: number;
  location: string;
  special_requests?: string;
  preferred_start_date?: string;
  preferred_end_date?: string;
  start_time?: string;
  end_time?: string;
  total_cost?: number;
  preferred_times: string[];
  allow_weekends: boolean;
  allow_evenings: boolean;
  is_recurring: boolean;
  status: string;
  created_at: string;
  expires_at: string;
}

export default function BookingRequestManager() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Approval form state
  const [approvalNotes, setApprovalNotes] = useState('');

  // Rejection form state
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchBookingRequests();
  }, []);

  const fetchBookingRequests = async () => {
    try {
      setLoading(true);
      // Prefer trainer-scoped booking-management endpoint (trainer-only, returns pending for this trainer)
      const response = await bookingManagement.getBookingRequests();
      const raw = Array.isArray((response as any)?.booking_requests)
        ? (response as any).booking_requests
        : (Array.isArray(response) ? (response as any) : ((response as any)?.requests || (response as any)?.data || []));

      // Normalize: this endpoint already returns only pending requests; ensure each has status 'PENDING'
      const data: BookingRequest[] = (raw || []).map((r: any) => ({
        id: r.id,
        client_name: r.client_name,
        client_email: r.client_email,
        session_type: r.session_type,
        duration_minutes: r.duration_minutes,
        location: r.location,
        special_requests: r.special_requests,
        preferred_start_date: r.preferred_start_date,
        preferred_end_date: r.preferred_end_date,
        start_time: r.start_time,
        end_time: r.end_time,
        total_cost: r.total_cost,
        preferred_times: r.preferred_times || [],
        allow_weekends: !!r.allow_weekends,
        allow_evenings: !!r.allow_evenings,
        is_recurring: !!r.is_recurring,
        status: (r.status || 'PENDING'),
        created_at: r.created_at,
        expires_at: r.expires_at,
      }));

      // Helper: get local midnight for today
      const getTodayMidnight = () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      };

      const todayMidnight = getTodayMidnight().getTime();

      // Keep only future requests:
      // - prefer preferred_start_date or start_time
      // - if missing, fall back to expires_at
      // - if all missing, keep (defensive) so trainers still see them
      const isFuture = (r: BookingRequest) => {
        const primaryDateStr = r.preferred_start_date || r.start_time;
        const fallbackDateStr = r.expires_at;
        const pick = primaryDateStr || fallbackDateStr;
        if (!pick) return true; // show undated requests
        const d = new Date(pick);
        if (isNaN(d.getTime())) return true; // if unparsable, don't hide it
        // Compare by day (midnight) to avoid timezone off-by-one
        const requestMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        return requestMidnight >= todayMidnight;
      };

      // Keep only future requests (endpoint is pending-only)
      const futureRequests = data.filter(r => isFuture(r));

      // Optional: sort ascending by date
      futureRequests.sort((a, b) => {
        const aDate = new Date(a.preferred_start_date || a.start_time || 0).getTime();
        const bDate = new Date(b.preferred_start_date || b.start_time || 0).getTime();
        return aDate - bDate;
      });

      setRequests(futureRequests);
    } catch (err: any) {
      console.error('Failed to fetch booking requests:', err);
      setError('Failed to load booking requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) {
      setError('No request selected');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      // Use the preferred start date or the specific start_time from the request
      const confirmedDate = selectedRequest.start_time || selectedRequest.preferred_start_date;
      
      if (!confirmedDate) {
        setError('No date specified in the request');
        setActionLoading(false);
        return;
      }

      await bookingManagement.approveBooking({
        booking_request_id: selectedRequest.id,
        notes: approvalNotes,
      });

      // Remove the approved request from the list
      setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
      setSelectedRequest(null);
      
      // Reset form
      setApprovalNotes('');
      
    } catch (err: any) {
      console.error('Failed to approve booking:', err);
      setError(err.message || 'Failed to approve booking request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await bookingManagement.rejectBooking({
        booking_request_id: selectedRequest.id,
        rejection_reason: rejectionReason,
      });

      // Remove the rejected request from the list
      setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
      setSelectedRequest(null);
      
      // Reset form
      setRejectionReason('');
      
    } catch (err: any) {
      console.error('Failed to reject booking:', err);
      setError(err.message || 'Failed to reject booking request');
    } finally {
      setActionLoading(false);
    }
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

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading booking requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Booking Requests</h2>
        <span className="text-sm text-gray-500">
          {requests.length} pending request{requests.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
          <p className="text-gray-600">You don't have any pending booking requests at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div
              key={request.id}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                isExpired(request.expires_at) 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-indigo-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.client_name}
                    </h3>
                    {isExpired(request.expires_at) && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        Expired
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Session:</span> {request.session_type}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Duration:</span> {request.duration_minutes} minutes
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Location:</span> {request.location}
                      </p>
                    </div>
                    <div>
                      {request.start_time && request.end_time ? (
                        // New format: show specific requested time
                        <>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Requested Time:</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(request.start_time)} at {formatTime(request.start_time)} - {formatTime(request.end_time)}
                          </p>
                        </>
                      ) : (
                        // Old format: show preferred date range
                        <>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Preferred Date Range:</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            {request.preferred_start_date && request.preferred_end_date
                              ? `${formatDate(request.preferred_start_date)} - ${formatDate(request.preferred_end_date)}`
                              : 'Flexible'
                            }
                          </p>
                          {request.preferred_times && request.preferred_times.length > 0 && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Preferred Times:</span> {request.preferred_times.join(', ')}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {request.special_requests && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Special Requests:</span> {request.special_requests}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Requested: {formatDate(request.created_at)}</span>
                    <span>Expires: {formatDate(request.expires_at)}</span>
                    <span>Email: {request.client_email}</span>
                  </div>
                </div>

                <div className="ml-6">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
                  >
                    Review Request
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Review Booking Request from {selectedRequest.client_name}
              </h3>

              <div className="space-y-4">
                {/* Request Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Request Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Session:</span> {selectedRequest.session_type}</div>
                    <div><span className="font-medium">Duration:</span> {selectedRequest.duration_minutes} min</div>
                    <div><span className="font-medium">Location:</span> {selectedRequest.location}</div>
                    <div><span className="font-medium">Recurring:</span> {selectedRequest.is_recurring ? 'Yes' : 'No'}</div>
                  </div>
                </div>

                {/* Approval Section */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Approve Request</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">
                        This will approve the booking for the requested time slot
                      </span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Any additional notes for the client..."
                    />
                  </div>
                </div>

                {/* Rejection Section */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Reject Request</h4>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Rejection
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Please provide a reason for rejecting this request..."
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading || !rejectionReason.trim()}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Rejecting...' : 'Reject Request'}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Approving...' : 'Approve Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}