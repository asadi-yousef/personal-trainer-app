'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import PageHeader from '../../../components/PageHeader';
import OptimalScheduleFinder from '../../../components/Client/OptimalScheduleFinder';
import SchedulePreferences from '../../../components/Client/SchedulePreferences';
import SuggestedTimes from '../../../components/Client/SuggestedTimes';
import { mockUser } from '../../../lib/data';

/**
 * Customer scheduling page with optimal algorithm for finding best times
 */
export default function CustomerSchedulePage() {
  const searchParams = useSearchParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'find' | 'preferences' | 'suggestions'>('find');
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [isFindingOptimal, setIsFindingOptimal] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check backend status
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/health');
        if (response.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (error) {
        console.error('Backend health check failed:', error);
        setBackendStatus('offline');
      }
    };
    
    checkBackendStatus();
  }, []);

  // Check if trainer was pre-selected from trainers page
  useEffect(() => {
    const trainerParam = searchParams.get('trainer');
    if (trainerParam) {
      setSelectedTrainer(trainerParam);
      setActiveTab('find'); // Switch to find tab when trainer is pre-selected
    }
  }, [searchParams]);

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

  const handleFindOptimalSchedule = async () => {
    setIsFindingOptimal(true);
    // Simulate algorithm processing
    setTimeout(() => {
      setIsFindingOptimal(false);
      setActiveTab('suggestions');
    }, 2000);
  };

  const tabs = [
    { id: 'find', label: 'Find Optimal Schedule', icon: 'search' },
    { id: 'preferences', label: 'My Preferences', icon: 'settings' },
    { id: 'suggestions', label: 'Suggested Times', icon: 'clock' },
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
        <PageHeader user={mockUser} />

        <div className="p-6">
          {/* Backend Status Indicator */}
          {backendStatus === 'offline' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" data-aos="fade-down">
              <div className="flex items-center">
                <i data-feather="alert-triangle" className="h-5 w-5 text-red-600 mr-2"></i>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Backend Server Offline</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Cannot connect to the server. Please make sure the backend is running on http://127.0.0.1:8000
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {backendStatus === 'checking' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6" data-aos="fade-down">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Checking Server Status</h3>
                  <p className="text-sm text-yellow-700 mt-1">Verifying connection to backend server...</p>
                </div>
              </div>
            </div>
          )}

          {/* Page Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8" data-aos="fade-up">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Smart Scheduling 🧠
                </h1>
                <p className="text-gray-600">
                  Find the optimal training times that work perfectly with your schedule and goals.
                </p>
              </div>
              <button
                onClick={handleFindOptimalSchedule}
                disabled={isFindingOptimal}
                className="mt-4 lg:mt-0 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 focus-ring transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFindingOptimal ? (
                  <div className="flex items-center">
                    <i data-feather="loader" className="h-4 w-4 animate-spin mr-2"></i>
                    Finding Optimal Times...
                  </div>
                ) : (
                  'Find My Optimal Schedule'
                )}
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-lg mb-8" data-aos="fade-up" data-aos-delay="100">
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
          <div className="bg-white rounded-xl shadow-lg p-6" data-aos="fade-up" data-aos-delay="200">
            {activeTab === 'find' && (
              <OptimalScheduleFinder 
                selectedTrainer={selectedTrainer}
                onTrainerSelect={setSelectedTrainer}
                isFinding={isFindingOptimal}
                onBookingComplete={() => setActiveTab('suggestions')}
              />
            )}

            {activeTab === 'preferences' && (
              <SchedulePreferences />
            )}

            {activeTab === 'suggestions' && (
              <SuggestedTimes />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}







