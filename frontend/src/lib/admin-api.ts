/**
 * Admin API functions for authentication and management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  access_token: string;
  token_type: string;
  admin_info: {
    id: number;
    username: string;
    email: string;
    admin_level: string;
    is_active: boolean;
    last_login: string | null;
    created_at: string;
  };
}

export interface DashboardStats {
  users: {
    total: number;
    trainers: number;
    clients: number;
    new_this_week: number;
  };
  bookings: {
    total: number;
    completed: number;
    pending: number;
    new_this_week: number;
  };
  revenue: {
    total: number;
    currency: string;
  };
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  trainer_id?: number;
  profile_complete?: boolean;
  price_per_hour?: number;
  training_types?: string[];
}

export interface Trainer {
  id: number;
  user_id: number;
  name: string;
  email: string;
  profile_complete: boolean;
  price_per_hour: number;
  training_types: string[];
  gym_name: string;
  location_preference: string;
  created_at: string;
  profile_completion_date: string | null;
}

export interface Booking {
  id: number;
  client_name: string;
  trainer_name: string;
  session_type: string;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  status: string;
  total_cost: number;
  created_at: string;
}

// Admin Authentication
export const adminLogin = async (credentials: AdminLoginRequest): Promise<AdminLoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  return response.json();
};

export const getCurrentAdmin = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get admin info');
  }

  return response.json();
};

// Dashboard
export const getDashboardStats = async (token: string): Promise<DashboardStats> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get dashboard stats');
  }

  return response.json();
};

// User Management
export const getUsers = async (
  token: string,
  page: number = 1,
  limit: number = 20,
  search?: string,
  role?: string
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) params.append('search', search);
  if (role) params.append('role', role);

  const response = await fetch(`${API_BASE_URL}/api/admin/users?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get users');
  }

  return response.json();
};

export const toggleUserStatus = async (token: string, userId: number) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/toggle-status`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to toggle user status');
  }

  return response.json();
};

export const bulkToggleUserStatus = async (token: string, userIds: number[], action: 'activate' | 'deactivate') => {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/bulk-toggle-status`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_ids: userIds,
      action: action
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to perform bulk action');
  }

  return response.json();
};

// Trainer Management
export const getTrainers = async (
  token: string,
  page: number = 1,
  limit: number = 20,
  search?: string,
  status_filter?: string
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) params.append('search', search);
  if (status_filter) params.append('status_filter', status_filter);

  const response = await fetch(`${API_BASE_URL}/api/admin/trainers?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get trainers');
  }

  return response.json();
};

// Booking Management
export const getBookings = async (
  token: string,
  page: number = 1,
  limit: number = 20,
  status_filter?: string
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (status_filter) params.append('status_filter', status_filter);

  const response = await fetch(`${API_BASE_URL}/api/admin/bookings?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get bookings');
  }

  return response.json();
};
