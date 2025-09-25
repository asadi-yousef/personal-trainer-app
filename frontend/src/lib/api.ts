/**
 * API client for FitConnect backend
 */

const API_BASE_URL = 'http://localhost:8000/api';

// Types
export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: 'client' | 'trainer' | 'admin';
  avatar?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  full_name: string;
  password: string;
  role: 'client' | 'trainer' | 'admin';
}

export interface Trainer {
  id: number;
  user_id: number;
  specialty: string;
  price_per_session: number;
  bio?: string;
  cover_image?: string;
  experience_years: number;
  certifications?: string;
  availability?: string;
  location?: string;
  rating: number;
  reviews_count: number;
  is_available: boolean;
  created_at: string;
  user_name: string;
  user_email: string;
  user_avatar?: string;
}

// API Client Class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('access_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    this.token = response.access_token;
    localStorage.setItem('access_token', this.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    this.token = response.access_token;
    localStorage.setItem('access_token', this.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  }

  async logout(): Promise<void> {
    this.token = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Trainer methods
  async getTrainers(params?: {
    specialty?: string;
    min_price?: number;
    max_price?: number;
    min_rating?: number;
    location?: string;
    page?: number;
    size?: number;
  }): Promise<{
    trainers: Trainer[];
    total: number;
    page: number;
    size: number;
    total_pages: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/trainers?${queryString}` : '/trainers';
    
    return this.request(endpoint);
  }

  async getTrainer(id: number): Promise<Trainer> {
    return this.request<Trainer>(`/trainers/${id}`);
  }

  async createTrainerProfile(trainerData: {
    specialty: string;
    price_per_session: number;
    bio?: string;
    cover_image?: string;
    experience_years?: number;
    certifications?: string;
    availability?: string;
    location?: string;
  }): Promise<Trainer> {
    return this.request<Trainer>('/trainers/', {
      method: 'POST',
      body: JSON.stringify(trainerData),
    });
  }

  // Session methods
  async getSessions(params?: {
    status?: string;
    trainer_id?: number;
    client_id?: number;
    upcoming_only?: boolean;
  }): Promise<any[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/sessions?${queryString}` : '/sessions';
    
    return this.request(endpoint);
  }

  async createBooking(bookingData: {
    trainer_id: number;
    preferred_dates: string;
    session_type: string;
    duration_minutes: number;
    location?: string;
    special_requests?: string;
  }): Promise<any> {
    return this.request('/sessions/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export individual methods for convenience
export const auth = {
  login: (credentials: LoginRequest) => apiClient.login(credentials),
  register: (userData: RegisterRequest) => apiClient.register(userData),
  logout: () => apiClient.logout(),
  getCurrentUser: () => apiClient.getCurrentUser(),
  isAuthenticated: () => apiClient.isAuthenticated(),
  getStoredUser: () => apiClient.getStoredUser(),
};

export const trainers = {
  getAll: (params?: any) => apiClient.getTrainers(params),
  getById: (id: number) => apiClient.getTrainer(id),
  createProfile: (data: any) => apiClient.createTrainerProfile(data),
};

export const sessions = {
  getAll: (params?: any) => apiClient.getSessions(params),
  createBooking: (data: any) => apiClient.createBooking(data),
};

