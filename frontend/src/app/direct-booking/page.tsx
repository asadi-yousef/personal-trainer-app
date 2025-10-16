'use client';

import DirectBooking from '../../components/Client/DirectBooking';
import { ProtectedRoute } from '../../contexts/AuthContext';

export default function DirectBookingPage() {
  return (
    <ProtectedRoute requiredRole="client">
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <DirectBooking />
        </div>
      </div>
    </ProtectedRoute>
  );
}