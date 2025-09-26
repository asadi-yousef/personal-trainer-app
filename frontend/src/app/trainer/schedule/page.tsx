'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import PageHeader from '../../../components/PageHeader';
import TrainerScheduleOptimizer from '../../../components/Trainer/TrainerScheduleOptimizer';
import ClientScheduleView from '../../../components/Trainer/ClientScheduleView';
import ScheduleAnalytics from '../../../components/Trainer/ScheduleAnalytics';
import { mockTrainerUser } from '../../../lib/data';

/**
 * Trainer scheduling page for optimizing client schedules and managing availability
 */
export default function TrainerSchedulePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'optimize' | 'clients' | 'analytics'>('optimize');
  const [isOptimizing, setIsOptimizing] = useState(false);

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
  }, [sidebarCollapsed, mounted, activeTab]);

  const handleOptimizeSchedule = async () => {
    setIsOptimizing(true);
    // Simulate algorithm processing
    setTimeout(() => {
      setIsOptimizing(false);
    }, 3000);
  };

  const tabs = [
    { id: 'optimize', label: 'Optimize My Schedule', icon: 'zap' },
    { id: 'clients', label: 'Client Schedules', icon: 'users' },
    { id: 'analytics', label: 'Schedule Analytics', icon: 'bar-chart' },
  ];

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
          {/* Page Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8" data-aos="fade-up">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Schedule Optimization 🎯
                </h1>
                <p className="text-gray-600">
                  Optimize your training schedule to maximize client satisfaction and your efficiency.
                </p>
              </div>
              <button
                onClick={handleOptimizeSchedule}
                disabled={isOptimizing}
                className="mt-4 lg:mt-0 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 focus-ring transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOptimizing ? (
                  <div className="flex items-center">
                    <i data-feather="loader" className="h-4 w-4 animate-spin mr-2"></i>
                    Optimizing Schedule...
                  </div>
                ) : (
                  'Optimize My Schedule'
                )}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" data-aos="fade-up" data-aos-delay="100">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <i data-feather="calendar" className="h-6 w-6 text-indigo-600"></i>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">24</div>
                  <div className="text-sm text-gray-600">Sessions This Week</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <i data-feather="users" className="h-6 w-6 text-green-600"></i>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">18</div>
                  <div className="text-sm text-gray-600">Active Clients</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <i data-feather="clock" className="h-6 w-6 text-yellow-600"></i>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">85%</div>
                  <div className="text-sm text-gray-600">Utilization Rate</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <i data-feather="trending-up" className="h-6 w-6 text-purple-600"></i>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">+12%</div>
                  <div className="text-sm text-gray-600">Efficiency Gain</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-lg mb-8" data-aos="fade-up" data-aos-delay="200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-smooth focus-ring ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <i data-feather={tab.icon} className="h-4 w-4"></i>
                      <span>{tab.label}</span>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="300">
            {activeTab === 'optimize' && (
              <TrainerScheduleOptimizer isOptimizing={isOptimizing} />
            )}

            {activeTab === 'clients' && (
              <ClientScheduleView />
            )}

            {activeTab === 'analytics' && (
              <ScheduleAnalytics />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



