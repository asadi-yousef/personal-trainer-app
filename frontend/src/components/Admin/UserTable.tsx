'use client';

import { useState, useEffect } from 'react';
import { User } from '../../lib/data';

interface UserTableProps {
  users: User[];
}

/**
 * User table component for admin dashboard
 */
export default function UserTable({ users }: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'client' | 'trainer' | 'admin'>('all');

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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    const colors = {
      'client': 'bg-blue-100 text-blue-800',
      'trainer': 'bg-green-100 text-green-800',
      'admin': 'bg-purple-100 text-purple-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <i data-feather="search" className="h-4 w-4 text-gray-400"></i>
            </div>
          </div>
        </div>
        <div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="client">Clients</option>
            <option value="trainer">Trainers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {user.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="flex items-center text-green-600">
                    <i data-feather="check-circle" className="h-4 w-4 mr-1"></i>
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-900 focus-ring rounded-md p-1">
                      <i data-feather="edit" className="h-4 w-4"></i>
                    </button>
                    <button className="text-red-600 hover:text-red-900 focus-ring rounded-md p-1">
                      <i data-feather="trash-2" className="h-4 w-4"></i>
                    </button>
                    <button className="text-gray-600 hover:text-gray-900 focus-ring rounded-md p-1">
                      <i data-feather="more-horizontal" className="h-4 w-4"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{filteredUsers.length}</span> of{' '}
          <span className="font-medium">{users.length}</span> users
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 focus-ring">
            Previous
          </button>
          <button className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 focus-ring">
            1
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 focus-ring">
            2
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 focus-ring">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}









