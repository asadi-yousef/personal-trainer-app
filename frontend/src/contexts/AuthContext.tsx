'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, User } from '../lib/api';

// Define the context type
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    username: string;
    full_name: string;
    password: string;
    role: 'client' | 'trainer' | 'admin';
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have a stored token
        if (auth.isAuthenticated()) {
          // Try to get current user from API
          const currentUser = await auth.getCurrentUser();
          setUser(currentUser);
        } else {
          // Check if we have stored user data
          const storedUser = auth.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
          }
        }
      } catch (error) {
        // Only log if it's not a credential validation error
        if (!error.message?.includes('Could not validate credentials')) {
          console.error('Auth initialization failed:', error);
        }
        // Clear invalid auth data
        auth.logout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);


  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await auth.login({ email, password });
      setUser(response.user);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: {
    email: string;
    username: string;
    full_name: string;
    password: string;
    role: 'client' | 'trainer' | 'admin';
  }) => {
    try {
      setIsLoading(true);
      const response = await auth.register(userData);
      setUser(response.user);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    auth.logout();
    setUser(null);
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      if (auth.isAuthenticated()) {
        const currentUser = await auth.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  };

  // Context value
  const value: AuthContextType = {
    user,
    token: auth.getToken(),
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'client' | 'trainer' | 'admin';
  fallback?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback = <div>Loading...</div> 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return <div>Please log in to access this page.</div>;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <div>You don't have permission to access this page.</div>;
  }

  return <>{children}</>;
}
