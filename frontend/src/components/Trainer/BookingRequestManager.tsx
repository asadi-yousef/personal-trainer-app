'use client';

import { useState, useEffect } from 'react';
import { bookingRequests } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useFeatherIcons } from '../../utils/featherIcons';

interface BookingRequest {
  id: number;
  client_id: number;
  trainer_id: number;
  session_type: string;
  duration_minutes: number;
  location: string;
  special_requests: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  preferred_start_date: string;
  preferred_end_date: string;
  preferred_times: string[];
  avoid_times: string[];
  allow_weekends: boolean;
  allow_evenings: boolean;
  is_recurring: boolean;
  recurring_pattern: string;
  confirmed_date?: string;
  alternative_dates?: string[];
  notes?: string;
  rejection_reason?: string;
  expires_at: string;
  created_at: string;
  client_name: string;
  trainer_name: string;
}

export default function BookingRequestManager() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    status: 'approved' as 'approved' | 'rejected',
    confirmed_date: '',
    alternative_dates: [] as string[],
    notes: '',
    rejection_reason: ''
  });
  const { user } = useAuth();

  // Fetch trainer's booking requests
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.trainer_profile) return;
      
      try {
        setLoading(true);
        const data = await bookingRequests.getAll({ trainer_id: user.trainer_profile.id });
        setRequests(data || []);
      } catch (error) {
        console.error('Failed to fetch booking requests:', error);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, [user]);

  // Use safe feather icon replacement
  useFeatherIcons([requests, showApprovalModal]);

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;

    try {
      await bookingRequests.approve(selectedRequest.id, approvalData);
      
      // Refresh requests
      const data = await bookingRequests.getAll({ trainer_id: user?.trainer_profile?.id });
      setRequests(data || []);
      
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setApprovalData({
        status: 'approved',
        confirmed_date: '',
        alternative_dates: [],
        notes: '',
        rejection_reason: ''
      });
    } catch (error) {
      console.error('Failed to approve/reject request:', error);
      alert('Failed to process request');
    }
  };

  const openApprovalModal = (request: BookingRequest, status: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setApprovalData({
      status,
      confirmed_date: request.preferred_start_date ? new Date(request.preferred_start_date).toISOString().slice(0, 16) : '',
      alternative_dates: [],
      notes: '',
      rejection_reason: ''
    });
    setShowApprovalModal(true);
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
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
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <i data-feather="inbox" className="h-5 w-5 mr-2 text-indigo-600"></i>
          Booking Requests
        </h3>
        <div className="flex space-x-2">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
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

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <i data-feather="inbox" className="h-12 w-12 mx-auto mb-4 text-gray-300"></i>
            <p>No {filter === 'all' ? '' : filter} booking requests found.</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.id} className={`bg-white border rounded-lg p-6 ${
              request.status === 'pending' ? 'border-yellow-200 bg-yellow-50' : 
              request.status === 'approved' ? 'border-green-200 bg-green-50' :
              request.status === 'rejected' ? 'border-red-200 bg-red-50' :
              'border-gray-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <i data-feather="user" className="h-5 w-5 text-indigo-600"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {request.client_name}
                      </h4>
                      <p className="text-sm text-gray-600">{request.session_type}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                    {isExpired(request.expires_at) && request.status === 'pending' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Expired
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <p className="font-medium">{request.duration_minutes} min</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <p className="font-medium">{request.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Preferred:</span>
                      <p className="font-medium">{formatDate(request.preferred_start_date)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Until:</span>
                      <p className="font-medium">{formatDate(request.preferred_end_date)}</p>
                    </div>
                  </div>

                  {request.preferred_times && request.preferred_times.length > 0 && (
                    <div className="mb-3">
                      <span className="text-gray-500 text-sm">Preferred Times:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {request.preferred_times.map((time, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {request.special_requests && (
                    <div className="mb-3">
                      <span className="text-gray-500 text-sm">Special Requests:</span>
                      <p className="text-sm text-gray-700 mt-1">{request.special_requests}</p>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Requested: {formatDate(request.created_at)} • 
                    Expires: {formatDate(request.expires_at)}
                  </div>
                </div>
                
                {request.status === 'pending' && !isExpired(request.expires_at) && (
                  <div className="ml-4 flex space-x-2">
                    <button
                      onClick={() => openApprovalModal(request, 'approved')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center"
                    >
                      <i data-feather="check" className="h-4 w-4 mr-1"></i>
                      Approve
                    </button>
                    <button
                      onClick={() => openApprovalModal(request, 'rejected')}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center"
                    >
                      <i data-feather="x" className="h-4 w-4 mr-1"></i>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Request Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total:</span>
            <p className="font-medium">{requests.length}</p>
          </div>
          <div>
            <span className="text-gray-500">Pending:</span>
            <p className="font-medium">{requests.filter(r => r.status === 'pending').length}</p>
          </div>
          <div>
            <span className="text-gray-500">Approved:</span>
            <p className="font-medium">{requests.filter(r => r.status === 'approved').length}</p>
          </div>
          <div>
            <span className="text-gray-500">Rejected:</span>
            <p className="font-medium">{requests.filter(r => r.status === 'rejected').length}</p>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {approvalData.status === 'approved' ? 'Approve' : 'Reject'} Booking Request
              </h3>
              
              <div className="space-y-4">
                {approvalData.status === 'approved' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmed Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={approvalData.confirmed_date}
                      onChange={(e) => setApprovalData({...approvalData, confirmed_date: e.target.value})}
                      required
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {approvalData.status === 'approved' ? 'Notes' : 'Rejection Reason'}
                  </label>
                  <textarea
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    rows={3}
                    value={approvalData.status === 'approved' ? approvalData.notes : approvalData.rejection_reason}
                    onChange={(e) => setApprovalData({
                      ...approvalData, 
                      [approvalData.status === 'approved' ? 'notes' : 'rejection_reason']: e.target.value
                    })}
                    placeholder={approvalData.status === 'approved' ? 'Optional notes for the client...' : 'Please explain why this request is being rejected...'}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveRequest}
                  className={`px-4 py-2 text-white rounded-md transition-colors ${
                    approvalData.status === 'approved' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {approvalData.status === 'approved' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
