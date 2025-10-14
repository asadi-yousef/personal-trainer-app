'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../../components/Sidebar';
import PageHeader from '../../../components/PageHeader';
import { ProtectedRoute, useAuth } from '../../../contexts/AuthContext';
import { apiClient } from '../../../lib/api';

interface TrainerLite {
  id: number;
  user?: { full_name: string; avatar?: string };
  specialty?: string | null;
  rating?: number | null;
  price_per_session?: number | null;
}

interface Booking {
  id: number;
  trainer_id: number;
  trainer?: TrainerLite;
  trainer_name?: string;
  status: string;
  confirmed_date?: string | null;
}

interface SessionItem {
  id: number;
  trainer_id: number;
  trainer_name?: string;
  status: string;
  scheduled_date: string;
}

function ClientTrainersContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trainers, setTrainers] = useState<TrainerLite[]>([]);
  const { user } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [confirmedBookings, confirmedSessions] = await Promise.all([
        apiClient.get<Booking[]>('/bookings?status=confirmed'),
        apiClient.get<SessionItem[]>('/sessions?status=confirmed')
      ]);

      // Build set of trainer IDs from bookings and sessions
      const trainerIds = new Set<number>();
      (confirmedBookings || []).forEach(b => b.trainer_id && trainerIds.add(b.trainer_id));
      (confirmedSessions || []).forEach(s => s.trainer_id && trainerIds.add(s.trainer_id));

      // If we have IDs, fetch trainer profiles individually (fallback to names from records)
      const uniqueIds = Array.from(trainerIds);
      const fetchedTrainers: TrainerLite[] = [];
      for (const id of uniqueIds) {
        try {
          const t = await apiClient.get<any>(`/trainers/${id}`);
          // Normalize
          fetchedTrainers.push({
            id: t.id || id,
            user: t.user || { full_name: t.user_name || t.name || 'Trainer' },
            specialty: t.specialty || null,
            rating: t.rating || null,
            price_per_session: t.price_per_session || null,
          });
        } catch {
          // Fallback minimal data if trainer endpoint fails
          const booking = (confirmedBookings || []).find(b => b.trainer_id === id);
          const session = (confirmedSessions || []).find(s => s.trainer_id === id);
          const name = booking?.trainer?.user?.full_name || booking?.trainer_name || session?.trainer_name || 'Trainer';
          fetchedTrainers.push({ id, user: { full_name: name } });
        }
      }

      setTrainers(fetchedTrainers);
    } catch (e) {
      console.error('Failed to load client trainers', e);
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const sortedTrainers = useMemo(() => {
    return [...trainers].sort((a, b) => (a.user?.full_name || '').localeCompare(b.user?.full_name || ''));
  }, [trainers]);

  const handleBookAgain = (trainerId: number) => {
    window.location.href = `/client/schedule?trainer=${trainerId}`;
  };

  const handleMessage = (trainerId: number) => {
    // Navigate to individual chat with this trainer
    window.location.href = `/client/messages/${trainerId}`;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <PageHeader user={user} title="My Trainers" subtitle="Trainers you've trained with" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading your trainers...</p>
            </div>
          )}

          {/* Empty */}
          {!loading && sortedTrainers.length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Trainers Yet</h3>
              <p className="text-gray-600">Once you complete a session, your trainer will appear here.</p>
            </div>
          )}

          {/* Grid */}
          {!loading && sortedTrainers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedTrainers.map(t => (
                <div key={t.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={t.user?.avatar || 'https://i.pravatar.cc/200'}
                      alt={t.user?.full_name || 'Trainer'}
                      className="w-14 h-14 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-gray-900">{t.user?.full_name || 'Trainer'}</div>
                      {t.specialty && <div className="text-sm text-gray-600">{t.specialty}</div>}
                      <div className="text-xs text-gray-500">
                        {t.rating ? `Rating ${t.rating} ⭐` : 'Rating N/A'}
                        {t.price_per_session ? ` • $${t.price_per_session}/session` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center space-x-3">
                    <button
                      onClick={() => handleBookAgain(t.id)}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      Book Again
                    </button>
                    <button
                      onClick={() => handleMessage(t.id)}
                      className="flex-1 bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"
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

export default function ClientTrainersPage() {
  return (
    <ProtectedRoute allowedRoles={['client']}>
      <ClientTrainersContent />
    </ProtectedRoute>
  );
}
