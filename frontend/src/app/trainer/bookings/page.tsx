'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  location: string;
  status: string;
  confirmed_date: string;
  client_name?: string;
  client?: {
    user?: {
      full_name: string;
      avatar?: string;
    };
  };
}

interface DayBookings {
  date: Date;
  dayName: string;
  dateStr: string;
  bookings: Booking[];
}

function TrainerBookingsContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const { user } = useAuth();
  const router = useRouter();

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(d.setDate(diff));
  }

  function getWeekDays(weekStart: Date): DayBookings[] {
    const days: DayBookings[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      days.push({
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        bookings: []
      });
    }
    return days;
  }

  const fetchBookings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      // Get trainer's ID
      const trainerId = (user as any)?.trainer_id || user.id;
      
      // Fetch confirmed bookings
      const response = await apiClient.get<Booking[]>(`/bookings?trainer_id=${trainerId}&status=confirmed`);
      setBookings(response || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const weekDays = getWeekDays(currentWeekStart);
  
  // Distribute bookings to days
  bookings.forEach(booking => {
    if (booking.confirmed_date) {
      const bookingDate = new Date(booking.confirmed_date);
      const dayIndex = weekDays.findIndex(day => 
        day.date.toDateString() === bookingDate.toDateString()
      );
      if (dayIndex !== -1) {
        weekDays[dayIndex].bookings.push(booking);
      }
    }
  });

  // Sort bookings by time within each day
  weekDays.forEach(day => {
    day.bookings.sort((a, b) => 
      new Date(a.confirmed_date).getTime() - new Date(b.confirmed_date).getTime()
    );
  });

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getClientName = (booking: Booking) => {
    return booking.client_name || booking.client?.user?.full_name || 'Client';
  };

  const getClientAvatar = (booking: Booking) => {
    return booking.client?.user?.avatar || 'https://i.pravatar.cc/200';
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <PageHeader 
          user={user}
          title="My Bookings"
          subtitle="Weekly calendar view of your confirmed training sessions"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Calendar Controls */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Week of {currentWeekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {bookings.length} confirmed {bookings.length === 1 ? 'booking' : 'bookings'} this period
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={goToPreviousWeek}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Previous Week"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={goToToday}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={goToNextWeek}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Next Week"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading bookings...</p>
            </div>
          )}

          {/* Weekly Calendar Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-xl shadow-md overflow-hidden ${
                    isToday(day.date) ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  {/* Day Header */}
                  <div className={`p-4 text-center ${
                    isToday(day.date) 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-50 text-gray-900'
                  }`}>
                    <div className="font-semibold text-sm">{day.dayName}</div>
                    <div className="text-2xl font-bold mt-1">{day.date.getDate()}</div>
                  </div>

                  {/* Bookings for this day */}
                  <div className="p-3 space-y-2 min-h-[300px]">
                    {day.bookings.length > 0 ? (
                      day.bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 hover:bg-indigo-100 transition-colors cursor-pointer"
                          onClick={() => router.push(`/trainer/bookings/${booking.id}`)}
                        >
                          <div className="flex items-start space-x-2">
                            <img
                              src={getClientAvatar(booking)}
                              alt={getClientName(booking)}
                              className="w-8 h-8 rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {getClientName(booking)}
                              </div>
                              <div className="text-xs text-indigo-600 font-medium">
                                {formatTime(booking.confirmed_date)}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                {booking.session_type}
                              </div>
                              <div className="text-xs text-gray-500">
                                {booking.duration_minutes} min
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs">No sessions</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats Summary */}
          {!loading && bookings.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="text-sm text-gray-600">Total Sessions</div>
                <div className="text-3xl font-bold text-indigo-600 mt-2">{bookings.length}</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="text-sm text-gray-600">Total Hours</div>
                <div className="text-3xl font-bold text-green-600 mt-2">
                  {(bookings.reduce((sum, b) => sum + b.duration_minutes, 0) / 60).toFixed(1)}h
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="text-sm text-gray-600">Unique Clients</div>
                <div className="text-3xl font-bold text-purple-600 mt-2">
                  {new Set(bookings.map(b => b.client_id)).size}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="text-sm text-gray-600">This Week</div>
                <div className="text-3xl font-bold text-orange-600 mt-2">
                  {weekDays.reduce((sum, day) => sum + day.bookings.length, 0)}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function TrainerBookingsPage() {
  return (
    <ProtectedRoute allowedRoles={['trainer']}>
      <TrainerBookingsContent />
    </ProtectedRoute>
  );
}

