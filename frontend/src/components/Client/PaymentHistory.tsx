'use client';

import { useState, useEffect } from 'react';
import { payments } from '../../lib/api';

interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  currency: string;
  status: string;
  card_last_four: string;
  card_type: string;
  payment_date: string;
  transaction_id: string;
  trainer_name?: string;
  session_type?: string;
}

interface PaymentStats {
  total_payments: number;
  total_amount: number;
  successful_payments: number;
  pending_payments: number;
  failed_payments: number;
  refunded_payments: number;
  average_payment: number;
  currency: string;
}

export default function PaymentHistory() {
  const [paymentList, setPaymentList] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed' | 'refunded'>('all');

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await payments.getMyPayments();
      setPaymentList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch payments:', err);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await payments.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch payment stats:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCardIcon = (cardType: string) => {
    const type = cardType.toLowerCase();
    if (type.includes('visa')) return '💳 Visa';
    if (type.includes('mastercard')) return '💳 Mastercard';
    if (type.includes('american')) return '💳 Amex';
    if (type.includes('discover')) return '💳 Discover';
    return '💳 Card';
  };

  const filteredPayments = paymentList.filter(payment => {
    if (filter === 'all') return true;
    return payment.status.toLowerCase() === filter;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading payment history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
      </div>

      {/* Payment Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Total Spent</div>
            <div className="text-2xl font-bold text-gray-900">${stats.total_amount.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">{stats.total_payments} payments</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Successful</div>
            <div className="text-2xl font-bold text-green-600">{stats.successful_payments}</div>
            <div className="text-xs text-gray-500 mt-1">Completed payments</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Average</div>
            <div className="text-2xl font-bold text-indigo-600">${stats.average_payment.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">Per session</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending_payments}</div>
            <div className="text-xs text-gray-500 mt-1">Awaiting processing</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        {(['all', 'completed', 'pending', 'failed', 'refunded'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              filter === status
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Payment List */}
      {filteredPayments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? "You haven't made any payments yet."
              : `You don't have any ${filter} payments.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-indigo-500 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      ${payment.amount.toFixed(2)} {payment.currency}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {payment.session_type && (
                      <div>
                        <span className="text-gray-600">Session:</span>
                        <span className="ml-2 font-medium">{payment.session_type}</span>
                      </div>
                    )}
                    
                    {payment.trainer_name && (
                      <div>
                        <span className="text-gray-600">Trainer:</span>
                        <span className="ml-2 font-medium">{payment.trainer_name}</span>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="ml-2 font-medium">
                        {getCardIcon(payment.card_type)} ****{payment.card_last_four}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="ml-2 font-mono text-xs">{payment.transaction_id}</span>
                    </div>
                    
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Date:</span>
                      <span className="ml-2 font-medium">{formatDate(payment.payment_date)}</span>
                    </div>
                  </div>
                </div>

                <div className="ml-6">
                  <button
                    onClick={() => window.open(`/payments/${payment.id}`, '_blank')}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">About Your Payments</h4>
            <p className="text-blue-800 text-sm">
              All payment records are stored securely. For security, only the last 4 digits of your card are displayed.
              If you have any questions about a payment, please contact support or your trainer directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

