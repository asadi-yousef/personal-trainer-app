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
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 6 = Saturday
    // Adjust to Sunday as the start of the week
    return new Date(d.setDate(d.getDate() - day));
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
      console.log('Fetched bookings:', response);
      
      // Deduplicate bookings by client + time combination (keep the one with higher ID/newer)
      const uniqueBookings = response ? Array.from(
        new Map(
          response
            .sort((a, b) => b.id - a.id) // Sort by ID descending (keep newer ones)
            .map(booking => {
              const key = `${booking.client_id}_${booking.confirmed_date}`;
              return [key, booking];
            })
        ).values()
      ) : [];
      
      console.log('Unique bookings after deduplication:', uniqueBookings);
      console.log('Removed duplicates:', (response?.length || 0) - uniqueBookings.length);
      setBookings(uniqueBookings);
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

  const isCurrentWeek = () => {
    const today = new Date();
    const todayWeekStart = getWeekStart(today);
    return currentWeekStart.toDateString() === todayWeekStart.toDateString();
  };

  const openBookingDetails = (booking: Booking) => {
    console.log('Opening booking details:', booking);
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedBooking(null), 300); // Clear after animation
  };

  const formatFullDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
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
                {!isCurrentWeek() && (
                  <button
                    onClick={goToToday}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Today
                  </button>
                )}
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
                          onClick={() => openBookingDetails(booking)}
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

          {/* Booking Details Modal */}
          {isModalOpen && selectedBooking && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeModal}>
              {/* Background overlay */}
              <div className="fixed inset-0 bg-gray-900 bg-opacity-50"></div>

              {/* Modal panel */}
              <div 
                className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                  {/* Header */}
                  <div className="bg-indigo-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        Booking Details
                      </h3>
                      <button
                        onClick={closeModal}
                        className="text-white hover:text-gray-200 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="bg-white px-6 py-6">
                    {/* Client Info */}
                    <div className="flex items-center space-x-4 mb-6">
                      <img
                        src={getClientAvatar(selectedBooking)}
                        alt={getClientName(selectedBooking)}
                        className="w-16 h-16 rounded-full border-2 border-indigo-200"
                      />
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900">
                          {getClientName(selectedBooking)}
                        </h4>
                        <p className="text-sm text-gray-600">Client</p>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="space-y-4">
                      <div className="border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Session Type</p>
                            <p className="text-base font-medium text-gray-900 mt-1">
                              {selectedBooking.session_type}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Duration</p>
                            <p className="text-base font-medium text-gray-900 mt-1">
                              {selectedBooking.duration_minutes} minutes
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-sm text-gray-600">Date & Time</p>
                        <p className="text-base font-medium text-gray-900 mt-1">
                          {formatFullDateTime(selectedBooking.confirmed_date).date}
                        </p>
                        <p className="text-lg font-semibold text-indigo-600 mt-1">
                          {formatFullDateTime(selectedBooking.confirmed_date).time}
                        </p>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="text-base font-medium text-gray-900 mt-1">
                          {selectedBooking.location || 'Not specified'}
                        </p>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-sm text-gray-600">Status</p>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mt-1">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Confirmed
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        // Add contact client functionality here
                        closeModal();
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Contact Client
                    </button>
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

