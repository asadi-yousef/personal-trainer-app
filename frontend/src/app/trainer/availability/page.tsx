'use client';

import AvailabilityManager from '../../../components/Trainer/AvailabilityManager';
import Sidebar from '../../../components/Sidebar';
import PageHeader from '../../../components/PageHeader';
import { ProtectedRoute, useAuth } from '../../../contexts/AuthContext';
import { useState } from 'react';

function AvailabilityPageContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`main-content transition-all duration-300 ${sidebarCollapsed ? 'content-collapsed' : 'content-expanded'}`}>
        <PageHeader user={user} title="Availability" subtitle="Manage your weekly availability" />
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Availability Calendar</h2>
            <AvailabilityManager />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AvailabilityPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <AvailabilityPageContent />
    </ProtectedRoute>
  );
}


