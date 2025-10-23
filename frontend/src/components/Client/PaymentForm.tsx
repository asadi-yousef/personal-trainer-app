'use client';

import { useState } from 'react';
import { payments } from '../../lib/api';

interface PaymentFormProps {
  booking: {
    id: number;
    session_type: string;
    duration_minutes: number;
    total_cost: number;
    trainer_name?: string;
    scheduled_date?: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentForm({ booking, onSuccess, onCancel }: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debug logging
  console.log('DEBUG: PaymentForm received booking data:', booking);
  
  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingZip, setBillingZip] = useState('');

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    const formatted = digits.match(/.{1,4}/g)?.join(' ') || digits;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const getCardType = (number: string): string => {
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.startsWith('4')) return 'Visa';
    if (cleanNumber.startsWith('5')) return 'Mastercard';
    if (cleanNumber.startsWith('3')) return 'American Express';
    if (cleanNumber.startsWith('6')) return 'Discover';
    return 'Unknown';
  };

  const validateForm = (): boolean => {
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      setError('Invalid card number');
      return false;
    }
    
    if (!cardholderName.trim()) {
      setError('Cardholder name is required');
      return false;
    }
    
    const month = parseInt(expiryMonth);
    const year = parseInt(expiryYear);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    if (month < 1 || month > 12) {
      setError('Invalid expiry month');
      return false;
    }
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      setError('Card has expired');
      return false;
    }
    
    if (cvv.length < 3 || cvv.length > 4) {
      setError('Invalid CVV');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cleanCardNumber = cardNumber.replace(/\s/g, '');
      const cardType = getCardType(cleanCardNumber);

      await payments.create({
        booking_id: booking.id,
        card_number: cleanCardNumber,
        card_type: cardType,
        cardholder_name: cardholderName,
        expiry_month: parseInt(expiryMonth),
        expiry_year: parseInt(expiryYear),
        cvv: cvv,
        billing_address: billingAddress || undefined,
        billing_city: billingCity || undefined,
        billing_state: billingState || undefined,
        billing_zip: billingZip || undefined,
        notes: `Payment for ${booking.session_type} session`
      });

      onSuccess();
    } catch (err: any) {
      console.error('Payment failed:', err);
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Information</h2>

      {/* Booking Summary */}
      <div className="bg-indigo-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Booking Summary</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-600">Session Type:</div>
          <div className="font-medium">{booking.session_type}</div>
          
          {booking.trainer_name && (
            <>
              <div className="text-gray-600">Trainer:</div>
              <div className="font-medium">{booking.trainer_name}</div>
            </>
          )}
          
          <div className="text-gray-600">Duration:</div>
          <div className="font-medium">{booking.duration_minutes} minutes</div>
          
          {booking.scheduled_date && (
            <>
              <div className="text-gray-600">Scheduled:</div>
              <div className="font-medium">{new Date(booking.scheduled_date).toLocaleDateString()}</div>
            </>
          )}
          
          <div className="text-gray-600 text-lg">Total Amount:</div>
          <div className="font-bold text-lg text-indigo-600">
            ${(booking.total_cost && booking.total_cost > 0) ? booking.total_cost.toFixed(2) : '0.00'}
          </div>
        </div>
      </div>

      {/* Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-medium text-yellow-900 mb-1">Educational Project Notice</h4>
            <p className="text-yellow-800 text-sm">
              This is a simulated payment system for educational purposes only. No real charges will be made.
              You can use any test card number (e.g., 4111 1111 1111 1111 for Visa).
            </p>
          </div>
        </div>
      </div>

      {/* Debug warning for zero cost */}
      {(!booking.total_cost || booking.total_cost === 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="font-medium text-red-900 mb-1">Price Issue Detected</h4>
              <p className="text-red-800 text-sm">
                The session cost is showing as $0.00. This might be a pricing configuration issue. 
                Please contact support if this is unexpected.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Information */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Card Information</h3>
          
          <div className="space-y-4">
            {/* Card Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number *
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              {cardNumber && (
                <p className="text-sm text-gray-500 mt-1">Card Type: {getCardType(cardNumber)}</p>
              )}
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name *
              </label>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Month *
                </label>
                <select
                  value={expiryMonth}
                  onChange={(e) => setExpiryMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">MM</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month.toString().padStart(2, '0')}>
                      {month.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Year *
                </label>
                <select
                  value={expiryYear}
                  onChange={(e) => setExpiryYear(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">YYYY</option>
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV *
                </label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                  placeholder="123"
                  maxLength={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Billing Address (Optional) */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Billing Address (Optional)</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                placeholder="123 Main St"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={billingCity}
                  onChange={(e) => setBillingCity(e.target.value)}
                  placeholder="New York"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={billingState}
                  onChange={(e) => setBillingState(e.target.value)}
                  placeholder="NY"
                  maxLength={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={billingZip}
                  onChange={(e) => setBillingZip(e.target.value)}
                  placeholder="10001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Processing...' : `Pay $${(booking.total_cost && booking.total_cost > 0) ? booking.total_cost.toFixed(2) : '0.00'}`}
          </button>
        </div>
      </form>
    </div>
  );
}

