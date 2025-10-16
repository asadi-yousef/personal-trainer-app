'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../../components/Sidebar';
import PageHeader from '../../../components/PageHeader';
import { ProtectedRoute, useAuth } from '../../../contexts/AuthContext';
import { apiClient } from '../../../lib/api';

interface ClientLite {
  id: number;
  user?: { full_name: string; avatar?: string };
  last_session_date?: string | null;
  total_sessions?: number;
  status?: string;
}

interface Booking {
  id: number;
  client_id: number;
  client?: ClientLite;
  client_name?: string;
  status: string;
  confirmed_date?: string | null;
}

interface SessionItem {
  id: number;
  client_id: number;
  client_name?: string;
  status: string;
  scheduled_date: string;
}

function TrainerClientsContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientLite[]>([]);
  const { user } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [confirmedBookings, confirmedSessions] = await Promise.all([
        apiClient.get<Booking[]>('/bookings?status=confirmed'),
        apiClient.get<SessionItem[]>('/sessions?status=confirmed')
      ]);

      // Build set of client IDs from bookings and sessions
      const clientIds = new Set<number>();
      (confirmedBookings || []).forEach(b => b.client_id && clientIds.add(b.client_id));
      (confirmedSessions || []).forEach(s => s.client_id && clientIds.add(s.client_id));

      // If we have IDs, fetch client profiles individually (fallback to names from records)
      const uniqueIds = Array.from(clientIds);
      const fetchedClients: ClientLite[] = [];
      
      for (const id of uniqueIds) {
        try {
          // Try to get client info from user endpoint
          const clientData = await apiClient.get<any>(`/users/${id}`);
          fetchedClients.push({
            id: clientData.id || id,
            user: {
              full_name: clientData.full_name || clientData.username || 'Client',
              avatar: clientData.avatar
            },
            last_session_date: confirmedSessions?.find(s => s.client_id === id)?.scheduled_date || 
                             confirmedBookings?.find(b => b.client_id === id)?.confirmed_date,
            total_sessions: (confirmedSessions || []).filter(s => s.client_id === id).length +
                           (confirmedBookings || []).filter(b => b.client_id === id).length,
            status: 'active'
          });
        } catch {
          // Fallback minimal data if client endpoint fails
          const booking = (confirmedBookings || []).find(b => b.client_id === id);
          const session = (confirmedSessions || []).find(s => s.client_id === id);
          const name = booking?.client?.user?.full_name || booking?.client_name || session?.client_name || 'Client';
          fetchedClients.push({ 
            id, 
            user: { full_name: name },
            last_session_date: session?.scheduled_date || booking?.confirmed_date,
            total_sessions: 1,
            status: 'active'
          });
        }
      }

      setClients(fetchedClients);
    } catch (e) {
      console.error('Failed to load trainer clients', e);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => (a.user?.full_name || '').localeCompare(b.user?.full_name || ''));
  }, [clients]);

  const handleMessage = (clientId: number) => {
    // Navigate to individual chat with this client
    window.location.href = `/trainer/messages/${clientId}`;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'No sessions yet';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <PageHeader user={user} title="My Clients" subtitle="Clients who have trained with you" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading your clients...</p>
            </div>
          )}

          {/* Empty */}
          {!loading && sortedClients.length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Clients Yet</h3>
              <p className="text-gray-600">Once clients book and complete sessions with you, they will appear here.</p>
            </div>
          )}

          {/* Grid */}
          {!loading && sortedClients.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedClients.map(client => (
                <div key={client.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={client.user?.avatar || 'https://i.pravatar.cc/200'}
                      alt={client.user?.full_name || 'Client'}
                      className="w-14 h-14 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-gray-900">{client.user?.full_name || 'Client'}</div>
                      <div className="text-sm text-gray-600">
                        {client.total_sessions} session{client.total_sessions !== 1 ? 's' : ''} completed
                      </div>
                      <div className="text-xs text-gray-500">
                        Last session: {formatDate(client.last_session_date)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => handleMessage(client.id)}
                      className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function TrainerClientsPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <TrainerClientsContent />
    </ProtectedRoute>
  );
}

