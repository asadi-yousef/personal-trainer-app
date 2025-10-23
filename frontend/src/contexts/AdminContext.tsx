'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminLoginResponse } from '@/lib/admin-api';

interface AdminContextType {
  admin: AdminLoginResponse['admin_info'] | null;
  token: string | null;
  login: (token: string, admin: AdminLoginResponse['admin_info']) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminLoginResponse['admin_info'] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored admin data on mount
    const storedToken = localStorage.getItem('admin_token');
    const storedAdmin = localStorage.getItem('admin_info');

    if (storedToken && storedAdmin) {
      try {
        const adminData = JSON.parse(storedAdmin);
        setToken(storedToken);
        setAdmin(adminData);
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (newToken: string, adminData: AdminLoginResponse['admin_info']) => {
    setToken(newToken);
    setAdmin(adminData);
    localStorage.setItem('admin_token', newToken);
    localStorage.setItem('admin_info', JSON.stringify(adminData));
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
  };

  const value: AdminContextType = {
    admin,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!admin,
    isLoading,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

