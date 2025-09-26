'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/Cards/StatCard';
import BookingCard from '../../components/Trainer/BookingCard';
import AvailabilityCalendar from '../../components/Trainer/AvailabilityCalendar';
import ProgramCard from '../../components/Trainer/ProgramCard';
import { mockTrainerStats, mockTrainerBookings, mockTrainerPrograms, mockTrainerUser } from '../../lib/data';

/**
 * Trainer dashboard page with sidebar and main content
 */
export default function TrainerDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize AOS animations
    const initAOS = async () => {
      const AOS = (await import('aos')).default;
      AOS.init({
        duration: 800,
        once: true,
        offset: 100,
      });
    };

    // Initialize feather icons
    const initFeather = async () => {
      const feather = (await import('feather-icons')).default;
      feather.replace();
    };

    initAOS();
    initFeather();
  }, []);

  useEffect(() => {
    if (mounted) {
      const loadFeatherIcons = async () => {
        try {
          const feather = (await import('feather-icons')).default;
          feather.replace();
        } catch (error) {
          console.error('Failed to load feather icons:', error);
        }
      };
      loadFeatherIcons();
    }
  }, [sidebarCollapsed, mounted]);

  const upcomingBookings = mockTrainerBookings.filter(booking => 
    booking.status === 'Confirmed' || booking.status === 'Pending'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Content */}
      <div className={`main-content transition-all duration-300 ${sidebarCollapsed ? 'content-collapsed' : 'content-expanded'}`}>
        {/* Top Bar */}
        <PageHeader user={mockTrainerUser} />

        <div className="p-6">
          {/* Welcome Banner */}
          <div className="bg-indigo-600 rounded-xl p-6 mb-8 text-white" data-aos="fade-up">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                  Welcome back, {mockTrainerUser.name}! 💪
                </h1>
                <p className="text-indigo-100">
                  Ready to help your clients achieve their fitness goals? Let's make today great!
                </p>
              </div>
              <button className="mt-4 lg:mt-0 bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-smooth focus-ring">
                Update Availability
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {mockTrainerStats.map((stat, index) => (
              <div key={stat.id} data-aos="fade-up" data-aos-delay={index * 100}>
                <StatCard stat={stat} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Upcoming Bookings */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h2>
                  <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium focus-ring rounded-md p-1">
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {upcomingBookings.map((booking, index) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>

              {/* Availability Calendar */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="100">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Availability Calendar</h2>
                <AvailabilityCalendar />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Active Programs */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Active Programs</h2>
                  <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium focus-ring rounded-md p-1">
                    Create New
                  </button>
                </div>
                <div className="space-y-4">
                  {mockTrainerPrograms.map((program) => (
                    <ProgramCard key={program.id} program={program} />
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="300">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-smooth focus-ring">
                    <div className="flex items-center">
                      <i data-feather="calendar" className="h-5 w-5 text-indigo-600 mr-3"></i>
                      <span className="font-medium">Schedule Session</span>
                    </div>
                  </button>
                  <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-smooth focus-ring">
                    <div className="flex items-center">
                      <i data-feather="clipboard" className="h-5 w-5 text-indigo-600 mr-3"></i>
                      <span className="font-medium">Create Program</span>
                    </div>
                  </button>
                  <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-smooth focus-ring">
                    <div className="flex items-center">
                      <i data-feather="users" className="h-5 w-5 text-indigo-600 mr-3"></i>
                      <span className="font-medium">Manage Clients</span>
                    </div>
                  </button>
                  <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-smooth focus-ring">
                    <div className="flex items-center">
                      <i data-feather="trending-up" className="h-5 w-5 text-indigo-600 mr-3"></i>
                      <span className="font-medium">View Analytics</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



