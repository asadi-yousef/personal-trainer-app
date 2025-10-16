'use client';

import { useState, useEffect } from 'react';

/**
 * Client schedule view component for trainers
 */
export default function ClientScheduleView() {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const loadFeatherIcons = async () => {
      try {
        const feather = (await import('feather-icons')).default;
        feather.replace();
      } catch (error) {
        console.error('Failed to load feather icons:', error);
      }
    };
    loadFeatherIcons();
  }, []);

  // Mock client data
  const clients = [
    {
      id: '1',
      name: 'John Smith',
      avatar: 'https://i.pravatar.cc/150?img=1',
      sessionType: 'Strength Training',
      frequency: '3x per week',
      nextSession: '2024-01-15 09:00',
      totalSessions: 24,
      progress: 85
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      avatar: 'https://i.pravatar.cc/150?img=2',
      sessionType: 'Cardio HIIT',
      frequency: '2x per week',
      nextSession: '2024-01-15 11:00',
      totalSessions: 18,
      progress: 72
    },
    {
      id: '3',
      name: 'Mike Chen',
      avatar: 'https://i.pravatar.cc/150?img=3',
      sessionType: 'Weight Loss',
      frequency: '4x per week',
      nextSession: '2024-01-15 14:00',
      totalSessions: 32,
      progress: 68
    }
  ];

  // Mock schedule data for selected client
  const getClientSchedule = (clientId: string) => {
    return [
      {
        id: '1',
        date: '2024-01-15',
        time: '09:00',
        duration: 60,
        type: 'Strength Training',
        status: 'confirmed',
        location: 'Studio A',
        notes: 'Focus on upper body strength'
      },
      {
        id: '2',
        date: '2024-01-17',
        time: '09:00',
        duration: 60,
        type: 'Strength Training',
        status: 'confirmed',
        location: 'Studio A',
        notes: 'Lower body workout'
      },
      {
        id: '3',
        date: '2024-01-19',
        time: '09:00',
        duration: 60,
        type: 'Strength Training',
        status: 'pending',
        location: 'Studio A',
        notes: 'Full body routine'
      }
    ];
  };

  const handleScheduleSession = (clientId: string) => {
    alert(`Note: Trainers cannot book sessions directly. Clients must request sessions through the booking system.`);
  };

  const handleOptimizeClientSchedule = (clientId: string) => {
    alert(`Optimizing schedule for ${clients.find(c => c.id === clientId)?.name}`);
  };

  return (
    <div className="space-y-8">
      {/* Client Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-feather="users" className="h-5 w-5 mr-2 text-indigo-600"></i>
          Select Client to View Schedule
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div
              key={client.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-smooth ${
                selectedClient === client.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedClient(client.id)}
            >
              <div className="flex items-center space-x-3 mb-3">
                <img
                  src={client.avatar}
                  alt={client.name}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{client.name}</h4>
                  <p className="text-sm text-gray-600">{client.sessionType}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Frequency:</span>
                  <span className="font-medium">{client.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Sessions:</span>
                  <span className="font-medium">{client.totalSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Progress:</span>
                  <span className="font-medium">{client.progress}%</span>
                </div>
              </div>

              {selectedClient === client.id && (
                <div className="mt-3 flex items-center text-indigo-600 text-sm">
                  <i data-feather="check" className="h-4 w-4 mr-1"></i>
                  Selected
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Client Schedule Details */}
      {selectedClient && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <i data-feather="calendar" className="h-5 w-5 mr-2 text-indigo-600"></i>
              Schedule for {clients.find(c => c.id === selectedClient)?.name}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleOptimizeClientSchedule(selectedClient)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus-ring transition-smooth text-sm"
              >
                Optimize Schedule
              </button>
              <button
                onClick={() => handleScheduleSession(selectedClient)}
                className="px-4 py-2 border border-gray-300 text-gray-500 rounded-md hover:bg-gray-50 focus-ring transition-smooth text-sm cursor-not-allowed opacity-60"
                disabled
                title="Trainers cannot book sessions directly. Clients must request sessions through the booking system."
              >
                Schedule New (Disabled)
              </button>
            </div>
          </div>

          {/* Schedule Calendar View */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="grid grid-cols-7 gap-4 mb-6">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center font-medium text-gray-700">
                  {day}
                </div>
              ))}
              
              {/* Calendar days - simplified for demo */}
              {Array.from({ length: 31 }, (_, i) => {
                const date = new Date(2024, 0, i + 1);
                const hasSession = Math.random() > 0.7; // Mock data
                return (
                  <div
                    key={i + 1}
                    className={`p-2 text-center rounded-lg cursor-pointer transition-smooth ${
                      hasSession
                        ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-sm">{i + 1}</div>
                    {hasSession && (
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mx-auto mt-1"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-4">Upcoming Sessions</h4>
            <div className="space-y-3">
              {getClientSchedule(selectedClient).map((session) => (
                <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">
                          {new Date(session.date).getDate()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(session.date).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">{session.time}</span>
                          <span className="text-sm text-gray-600">({session.duration} min)</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            session.status === 'confirmed' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                        
                        <div className="text-gray-600 text-sm mb-1">{session.type}</div>
                        <div className="flex items-center text-sm text-gray-500">
                          <i data-feather="map-pin" className="h-4 w-4 mr-1"></i>
                          {session.location}
                        </div>
                        {session.notes && (
                          <div className="text-sm text-gray-500 mt-1">
                            <i data-feather="file-text" className="h-4 w-4 mr-1 inline"></i>
                            {session.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-smooth">
                        <i data-feather="edit" className="h-4 w-4"></i>
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 transition-smooth">
                        <i data-feather="trash-2" className="h-4 w-4"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Client Insights */}
          <div className="mt-8 bg-indigo-50 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <i data-feather="trending-up" className="h-5 w-5 mr-2 text-indigo-600"></i>
              Client Insights
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-indigo-600">95%</div>
                <div className="text-sm text-gray-600">Attendance Rate</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">4.8</div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">12</div>
                <div className="text-sm text-gray-600">Weeks Training</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Optimal Schedule Recommendations:</div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Prefers morning sessions (9-11 AM)</li>
                <li>• Responds best to 60-minute sessions</li>
                <li>• Needs 48-hour rest between strength sessions</li>
                <li>• Most consistent on Tuesdays and Thursdays</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* No Client Selected */}
      {!selectedClient && (
        <div className="text-center py-12">
          <i data-feather="users" className="h-12 w-12 text-gray-400 mx-auto mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Client</h3>
          <p className="text-gray-600">Choose a client from above to view and optimize their schedule.</p>
        </div>
      )}
    </div>
  );
}


























