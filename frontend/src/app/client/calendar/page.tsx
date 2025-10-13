'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../../components/Sidebar';
import PageHeader from '../../../components/PageHeader';
import { ProtectedRoute, useAuth } from '../../../contexts/AuthContext';
import { apiClient } from '../../../lib/api';

interface Booking {
  id: number;
  client_id: number;
  trainer_id: number;
  session_type: string;
  duration_minutes: number;
  location: string | null;
  status: string;
  confirmed_date: string; // ISO
  client_name?: string;
  trainer_name?: string;
}

interface SessionItem {
  id: number;
  client_id: number;
  trainer_id: number;
  session_type: string;
  duration_minutes: number;
  location: string | null;
  status: string;
  scheduled_date: string; // ISO
  client_name?: string;
  trainer_name?: string;
}

interface DayBucket {
  date: Date;
  dayName: string;
  dateStr: string;
  items: Array<{
    type: 'booking' | 'session';
    id: number;
    title: string;
    timeISO: string;
    timeLabel: string;
    duration: number;
    location: string | null;
    trainerName?: string;
  }>;
}

function ClientCalendarContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const { user } = useAuth();

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    return new Date(d.setDate(d.getDate() - day)); // Sunday anchor
  }

  function getWeekDays(weekStart: Date): DayBucket[] {
    const days: DayBucket[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      days.push({
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        items: []
      });
    }
    return days;
  }

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      // Client role is enforced server-side to return only own data
      const [confirmedBookings, confirmedSessions] = await Promise.all([
        apiClient.get<Booking[]>('/bookings?status=confirmed'),
        apiClient.get<SessionItem[]>('/sessions?status=confirmed')
      ]);
      setBookings(Array.isArray(confirmedBookings) ? confirmedBookings : []);
      setSessions(Array.isArray(confirmedSessions) ? confirmedSessions : []);
    } catch (e) {
      console.error('Failed to load calendar data', e);
      setBookings([]);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);

  // Distribute items into days
  const filledDays = useMemo(() => {
    const copy = weekDays.map(d => ({ ...d, items: [...d.items] }));

    // Add confirmed bookings
    bookings.forEach(b => {
      if (!b.confirmed_date) return;
      const dt = new Date(b.confirmed_date);
      const idx = copy.findIndex(d => d.date.toDateString() === dt.toDateString());
      if (idx !== -1) {
        copy[idx].items.push({
          type: 'booking',
          id: b.id,
          title: b.session_type,
          timeISO: b.confirmed_date,
          timeLabel: formatTime(b.confirmed_date),
          duration: b.duration_minutes,
          location: b.location,
          trainerName: b.trainer_name
        });
      }
    });

    // Add confirmed sessions
    sessions.forEach(s => {
      const dt = new Date(s.scheduled_date);
      const idx = copy.findIndex(d => d.date.toDateString() === dt.toDateString());
      if (idx !== -1) {
        copy[idx].items.push({
          type: 'session',
          id: s.id,
          title: s.session_type || 'Training Session',
          timeISO: s.scheduled_date,
          timeLabel: formatTime(s.scheduled_date),
          duration: s.duration_minutes,
          location: s.location,
          trainerName: s.trainer_name
        });
      }
    });

    // Deduplicate per day by (timeISO + trainerName) preferring sessions over bookings, then sort by time
    copy.forEach(day => {
      // Prefer sessions over bookings at the exact same time with same trainer
      const byKey = new Map<string, typeof day.items[number]>();
      // Sort temporary to ensure sessions win ties
      const prefSorted = [...day.items].sort((a, b) => {
        if (a.timeISO === b.timeISO && (a.trainerName || '') === (b.trainerName || '')) {
          // session first
          if (a.type !== b.type) return a.type === 'session' ? -1 : 1;
        }
        // otherwise by time
        return new Date(a.timeISO).getTime() - new Date(b.timeISO).getTime();
      });
      prefSorted.forEach(item => {
        const key = `${item.timeISO}__${item.trainerName || ''}`;
        if (!byKey.has(key)) byKey.set(key, item);
      });
      day.items = Array.from(byKey.values()).sort((a, b) => new Date(a.timeISO).getTime() - new Date(b.timeISO).getTime());
    });
    return copy;
  }, [weekDays, bookings, sessions]);

  const goPrev = () => setCurrentWeekStart(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
  const goNext = () => setCurrentWeekStart(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
  const isCurrentWeek = () => getWeekStart(new Date()).toDateString() === currentWeekStart.toDateString();
  const goToday = () => setCurrentWeekStart(getWeekStart(new Date()));

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <PageHeader user={user} title="My Schedule" subtitle="Your confirmed sessions and bookings for the week" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Controls */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Week of {currentWeekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Showing confirmed bookings and sessions
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={goPrev} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Previous Week">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {!isCurrentWeek() && (
                  <button onClick={goToday} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Today</button>
                )}
                <button onClick={goNext} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Next Week">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading your schedule...</p>
            </div>
          )}

          {/* Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {filledDays.map((day, index) => (
                <div key={index} className={`bg-white rounded-xl shadow-md overflow-hidden ${day.date.toDateString() === new Date().toDateString() ? 'ring-2 ring-indigo-500' : ''}`}>
                  <div className={`p-4 text-center ${day.date.toDateString() === new Date().toDateString() ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-900'}`}>
                    <div className="font-semibold text-sm">{day.dayName}</div>
                    <div className="text-2xl font-bold mt-1">{day.date.getDate()}</div>
                  </div>

                  <div className="p-3 space-y-2 min-h-[300px]">
                    {day.items.length > 0 ? (
                      day.items.map(item => (
                        <div key={`${item.type}-${item.id}`} className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {item.title}
                              </div>
                              <div className="text-xs text-indigo-600 font-medium">{item.timeLabel}</div>
                              {item.trainerName && (
                                <div className="text-xs text-gray-600 truncate">with {item.trainerName}</div>
                              )}
                              <div className="text-xs text-gray-500">{item.duration} min</div>
                              {item.location && (
                                <div className="text-xs text-gray-500">{item.location}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs">No items</p>
                      </div>
                    )}
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

export default function ClientCalendarPage() {
  return (
    <ProtectedRoute allowedRoles={['client']}>
      <ClientCalendarContent />
    </ProtectedRoute>
  );
}
