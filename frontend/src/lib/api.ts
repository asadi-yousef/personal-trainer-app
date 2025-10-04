/**
 * API client for FitConnect backend
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

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
    // Only access localStorage in the browser
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log('API Request:', { url, endpoint, baseURL: this.baseURL, hasToken: !!this.token });
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add existing headers
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      console.log('API Error Response:', { status: response.status, error, url });
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    console.log('Login attempt:', { email: credentials.email, password: '***' });
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    this.token = response.access_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', this.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    this.token = response.access_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', this.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  }

  async logout(): Promise<void> {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
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

  // Booking methods
  async getBookings(params?: {
    status?: string;
    trainer_id?: number;
    client_id?: number;
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
    const endpoint = queryString ? `/bookings?${queryString}` : '/bookings';
    
    return this.request(endpoint);
  }

  async smartBooking(bookingData: {
    trainer_id?: number;  // Optional - if not provided, finds best trainer
    session_type: string;
    duration_minutes: number;
    location?: string;
    preferred_start_date: string;
    preferred_end_date: string;
    preferred_times?: string[];
    notes?: string;
  }): Promise<any> {
    return this.request('/bookings/smart-booking', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async findOptimalSchedule(bookingData: {
    trainer_id?: number;  // Optional - if not provided, finds best trainer
    session_type: string;
    duration_minutes: number;
    location?: string;
    earliest_date: string;
    latest_date: string;
    preferred_times?: string[];
    avoid_times?: string[];
    prioritize_convenience?: boolean;
    prioritize_cost?: boolean;
    allow_weekends?: boolean;
    allow_evenings?: boolean;
  }): Promise<any> {
    return this.request('/bookings/optimal-schedule', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async greedyOptimization(bookingData: {
    trainer_id?: number;  // Optional - if not provided, finds best trainer
    session_type: string;
    duration_minutes: number;
    location?: string;
    earliest_date: string;
    latest_date: string;
    preferred_times?: string[];
    avoid_times?: string[];
    prioritize_convenience?: boolean;
    prioritize_cost?: boolean;
    allow_weekends?: boolean;
    allow_evenings?: boolean;
  }, maxSuggestions: number = 5): Promise<any> {
    return this.request(`/bookings/greedy-optimization?max_suggestions=${maxSuggestions}`, {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async confirmBooking(bookingId: number, data: { confirmed_date: string }): Promise<any> {
    return this.request(`/bookings/${bookingId}/confirm`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateBooking(bookingId: number, data: any): Promise<any> {
    return this.request(`/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async cancelBooking(bookingId: number): Promise<any> {
    return this.request(`/bookings/${bookingId}/cancel`, {
      method: 'PUT',
    });
  }

  async getBooking(bookingId: number): Promise<any> {
    return this.request(`/bookings/${bookingId}`);
  }

  // Program methods
  async getPrograms(params?: {
    trainer_id?: number;
    client_id?: number;
    is_active?: boolean;
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
    const endpoint = queryString ? `/programs?${queryString}` : '/programs';
    
    return this.request(endpoint);
  }

  async getMyPrograms(): Promise<any[]> {
    return this.request('/programs/assignments/my-programs');
  }

  // Message methods
  async getMessages(params?: {
    conversation_id?: number;
    sender_id?: number;
    receiver_id?: number;
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
    const endpoint = queryString ? `/messages?${queryString}` : '/messages';
    
    return this.request(endpoint);
  }

  async createMessage(data: any): Promise<any> {
    return this.request('/messages/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMessage(id: number): Promise<any> {
    return this.request(`/messages/${id}`);
  }

  async markMessageAsRead(id: number): Promise<any> {
    return this.request(`/messages/${id}/read`, {
      method: 'PUT',
    });
  }

  async deleteMessage(id: number): Promise<any> {
    return this.request(`/messages/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics methods
  async getAnalyticsOverview(startDate?: string, endDate?: string): Promise<any> {
    const searchParams = new URLSearchParams();
    if (startDate) searchParams.append('start_date', startDate);
    if (endDate) searchParams.append('end_date', endDate);
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/analytics/overview?${queryString}` : '/analytics/overview';
    
    return this.request(endpoint);
  }

  async getSessionAnalytics(startDate?: string, endDate?: string): Promise<any> {
    const searchParams = new URLSearchParams();
    if (startDate) searchParams.append('start_date', startDate);
    if (endDate) searchParams.append('end_date', endDate);
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/analytics/sessions?${queryString}` : '/analytics/sessions';
    
    return this.request(endpoint);
  }

  async getClientAnalytics(startDate?: string, endDate?: string): Promise<any> {
    const searchParams = new URLSearchParams();
    if (startDate) searchParams.append('start_date', startDate);
    if (endDate) searchParams.append('end_date', endDate);
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/analytics/clients?${queryString}` : '/analytics/clients';
    
    return this.request(endpoint);
  }

  async getTrainerAnalytics(startDate?: string, endDate?: string): Promise<any> {
    const searchParams = new URLSearchParams();
    if (startDate) searchParams.append('start_date', startDate);
    if (endDate) searchParams.append('end_date', endDate);
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/analytics/trainers?${queryString}` : '/analytics/trainers';
    
    return this.request(endpoint);
  }

  async getKPIs(period: string = 'month'): Promise<any> {
    return this.request(`/analytics/kpis?period=${period}`);
  }

  async getRealtimeAnalytics(): Promise<any> {
    return this.request('/analytics/realtime');
  }

  // Fitness Goals methods
  async getFitnessGoals(): Promise<any[]> {
    return this.request('/session-tracking/fitness-goals');
  }

  async createFitnessGoal(goalData: any): Promise<any> {
    return this.request('/session-tracking/fitness-goals', {
      method: 'POST',
      body: JSON.stringify(goalData),
    });
  }

  // Availability methods
  async getMyAvailability(): Promise<any[]> {
    return this.request('/availability/me');
  }

  async createAvailability(data: any): Promise<any> {
    return this.request('/availability/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAvailability(id: number, data: any): Promise<any> {
    return this.request(`/availability/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAvailability(id: number): Promise<any> {
    return this.request(`/availability/${id}`, {
      method: 'DELETE',
    });
  }

  // Conversation methods
  async getConversations(): Promise<any[]> {
    return this.request('/messages/conversations/');
  }

  async getConversationMessages(conversationId: number): Promise<any[]> {
    return this.request(`/messages/conversations/${conversationId}/messages`);
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getStoredUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
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

export const bookings = {
  getAll: (params?: any) => apiClient.getBookings(params),
  getById: (id: number) => apiClient.getBooking(id),
  create: (data: any) => apiClient.createBooking(data),
  smartBooking: (data: any) => apiClient.smartBooking(data),
  findOptimalSchedule: (data: any) => apiClient.findOptimalSchedule(data),
  greedyOptimization: (data: any, maxSuggestions?: number) => apiClient.greedyOptimization(data, maxSuggestions),
  confirm: (id: number, data: any) => apiClient.confirmBooking(id, data),
  update: (id: number, data: any) => apiClient.updateBooking(id, data),
  cancel: (id: number) => apiClient.cancelBooking(id),
};

export const programs = {
  getAll: (params?: any) => apiClient.getPrograms(params),
  getMyPrograms: () => apiClient.getMyPrograms(),
};

export const messages = {
  getAll: (params?: any) => apiClient.getMessages(params),
  getById: (id: number) => apiClient.getMessage(id),
  create: (data: any) => apiClient.createMessage(data),
  markAsRead: (id: number) => apiClient.markMessageAsRead(id),
  delete: (id: number) => apiClient.deleteMessage(id),
  getConversations: () => apiClient.getConversations(),
  getConversationMessages: (conversationId: number) => apiClient.getConversationMessages(conversationId),
};

export const analytics = {
  getOverview: (startDate?: string, endDate?: string) => apiClient.getAnalyticsOverview(startDate, endDate),
  getSessionAnalytics: (startDate?: string, endDate?: string) => apiClient.getSessionAnalytics(startDate, endDate),
  getClientAnalytics: (startDate?: string, endDate?: string) => apiClient.getClientAnalytics(startDate, endDate),
  getTrainerAnalytics: (startDate?: string, endDate?: string) => apiClient.getTrainerAnalytics(startDate, endDate),
  getKPIs: (period?: string) => apiClient.getKPIs(period),
  getRealtime: () => apiClient.getRealtimeAnalytics(),
};

export const goals = {
  getAll: () => apiClient.getFitnessGoals(),
  create: (data: any) => apiClient.createFitnessGoal(data),
};

export const availability = {
  getMyAvailability: () => apiClient.getMyAvailability(),
  create: (data: any) => apiClient.createAvailability(data),
  update: (id: number, data: any) => apiClient.updateAvailability(id, data),
  delete: (id: number) => apiClient.deleteAvailability(id),
};

export const timeSlots = {
  getAvailable: (trainerId: number, date: string, durationMinutes: number = 60) => 
    apiClient.request(`/time-slots/trainer/${trainerId}/available?date=${date}&duration_minutes=${durationMinutes}`),
  book: (data: any) => apiClient.request('/time-slots/book', { method: 'POST', body: JSON.stringify(data) }),
  createBulk: (data: any) => apiClient.request('/time-slots/bulk-create', { method: 'POST', body: JSON.stringify(data) }),
  getTrainerSlots: (trainerId: number, startDate: string, endDate: string) => 
    apiClient.request(`/time-slots/trainer/${trainerId}?start_date=${startDate}&end_date=${endDate}`),
  update: (slotId: number, data: any) => apiClient.request(`/time-slots/${slotId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (slotId: number) => apiClient.request(`/time-slots/${slotId}`, { method: 'DELETE' }),
};

