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
      let error;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          error = await response.json();
        } else {
          const text = await response.text();
          console.log('Non-JSON error response:', text.substring(0, 200));
          error = { detail: `HTTP ${response.status}: ${response.statusText}` };
        }
      } catch (parseError) {
        error = { detail: `HTTP ${response.status}: ${response.statusText}` };
      }
      console.log('API Error Response:', { 
        status: response.status, 
        error: JSON.stringify(error, null, 2), 
        url 
      });
      
      // Better error message extraction
      const errorMessage = typeof error.detail === 'string' 
        ? error.detail 
        : error.message || JSON.stringify(error) || `HTTP ${response.status}`;
      
      const apiError = new Error(errorMessage);
      (apiError as any).response = { status: response.status, data: error };
      throw apiError;
    }

    return response.json();
  }

  // HTTP method shortcuts
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
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

  // Session management methods
  async completeSession(sessionId: number): Promise<any> {
    return this.request(`/sessions/${sessionId}/complete`, {
      method: 'POST',
    });
  }

  async cancelSession(sessionId: number): Promise<any> {
    return this.request(`/sessions/${sessionId}/cancel`, {
      method: 'POST',
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

  // **NEW MVP METHODS**
  async getUserConversations(userId: number): Promise<any[]> {
    return this.request(`/messages/conversations/${userId}`);
  }

  async getConversationHistory(userAId: number, userBId: number): Promise<any[]> {
    return this.request(`/messages/history/${userAId}/${userBId}`);
  }

  async markConversationRead(senderId: number, recipientId: number): Promise<any> {
    return this.request('/messages/read', {
      method: 'PUT',
      body: JSON.stringify({ sender_id: senderId, recipient_id: recipientId }),
    });
  }

  // Booking Management Methods
  async createBookingRequest(data: any): Promise<any> {
    return this.request('/booking-management/booking-request', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getBookingRequests(): Promise<any> {
    return this.request('/booking-management/booking-requests');
  }

  async getMyBookingRequests(): Promise<any> {
    return this.request('/booking-management/my-booking-requests');
  }

  async approveBooking(data: any): Promise<any> {
    return this.request('/booking-management/approve-booking', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async rejectBooking(data: any): Promise<any> {
    return this.request('/booking-management/reject-booking', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getMyBookings(): Promise<any> {
    return this.request('/booking-management/my-bookings');
  }

  async cancelBooking(data: any): Promise<any> {
    return this.request('/booking-management/cancel-booking', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async rescheduleBooking(data: any): Promise<any> {
    return this.request('/booking-management/reschedule-booking', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getAvailableSlots(trainerId: number, startDate: string, endDate: string, durationMinutes: number = 60): Promise<any> {
    return this.request(`/booking-management/available-slots/${trainerId}?start_date=${startDate}&end_date=${endDate}&duration_minutes=${durationMinutes}`);
  }

  // Time Slots Methods
  async bookTimeSlot(data: any): Promise<any> {
    return this.request('/time-slots/book', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async createBulkTimeSlots(data: any): Promise<any> {
    return this.request('/time-slots/bulk-create', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getTrainerTimeSlots(trainerId: number, startDate: string, endDate: string): Promise<any> {
    return this.request(`/time-slots/trainer/${trainerId}/available?date=${startDate}&duration_minutes=60`);
  }

  async updateTimeSlot(slotId: number, data: any): Promise<any> {
    return this.request(`/time-slots/${slotId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteTimeSlot(slotId: number): Promise<any> {
    return this.request(`/time-slots/${slotId}`, {
      method: 'DELETE'
    });
  }

  // Booking Requests Methods
  async getAllBookingRequests(params?: any): Promise<any> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/booking-requests${queryString}`);
  }

  async getBookingRequestById(id: number): Promise<any> {
    return this.request(`/booking-requests/${id}`);
  }

  async createBookingRequestOld(data: any): Promise<any> {
    return this.request('/booking-requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async approveBookingRequest(id: number, data: any): Promise<any> {
    return this.request(`/booking-requests/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateBookingRequest(id: number, data: any): Promise<any> {
    return this.request(`/booking-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async cancelBookingRequest(id: number): Promise<any> {
    return this.request(`/booking-requests/${id}`, {
      method: 'DELETE'
    });
  }

  // Payment Methods
  async createPayment(paymentData: {
    booking_id: number;
    card_number: string;
    card_type: string;
    cardholder_name: string;
    expiry_month: number;
    expiry_year: number;
    cvv: string;
    billing_address?: string;
    billing_city?: string;
    billing_state?: string;
    billing_zip?: string;
    notes?: string;
  }): Promise<any> {
    return this.request('/payments/', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  async getPayments(status?: string): Promise<any[]> {
    const queryString = status ? `?status=${status}` : '';
    return this.request(`/payments${queryString}`);
  }

  async getMyPayments(): Promise<any[]> {
    return this.request('/payments/my-payments');
  }

  async getPaymentById(paymentId: number): Promise<any> {
    return this.request(`/payments/${paymentId}`);
  }

  async getPaymentStats(): Promise<any> {
    return this.request('/payments/stats');
  }

  async refundPayment(data: {
    payment_id: number;
    refund_reason: string;
    refund_amount?: number;
  }): Promise<any> {
    return this.request('/payments/refund', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Trainer Profile Management
  async getMyTrainerProfile(): Promise<any> {
    return this.request('/trainer-profile/me');
  }

  async updateBasicInfo(data: {
    bio?: string;
    experience_years?: number;
    certifications?: string;
  }): Promise<any> {
    return this.request('/trainer-profile/basic-info', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async updateTrainingInfo(data: {
    training_types?: string[];
    specialty?: string;
  }): Promise<any> {
    return this.request('/trainer-profile/training-info', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async updateGymInfo(data: {
    gym_name?: string;
    gym_address?: string;
    gym_city?: string;
    gym_state?: string;
    gym_zip_code?: string;
    gym_phone?: string;
  }): Promise<any> {
    return this.request('/trainer-profile/gym-info', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async updatePricing(data: {
    price_per_hour: number;
  }): Promise<any> {
    return this.request('/trainer-profile/pricing', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // Scheduling Preferences
  async getSchedulingPreferences(): Promise<any> {
    return this.request('/scheduling-preferences/me');
  }

  async updateSchedulingPreferences(data: any): Promise<any> {
    return this.request('/scheduling-preferences/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async resetSchedulingPreferences(): Promise<any> {
    return this.request('/scheduling-preferences/reset', {
      method: 'POST'
    });
  }

  // Trainer Registration Methods
  async getProfileStatus(): Promise<any> {
    return this.request('/trainer-registration/profile-status');
  }

  async getRegistrationProgress(): Promise<any> {
    return this.request('/trainer-registration/progress');
  }

  async completeRegistration(data: any): Promise<any> {
    return this.request('/trainer-registration/complete', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
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
  getToken: () => apiClient.getToken(),
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
  complete: (sessionId: number) => apiClient.completeSession(sessionId),
  cancel: (sessionId: number) => apiClient.cancelSession(sessionId),
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

export const bookingManagement = {
  // Booking requests
  createBookingRequest: (data: any) => apiClient.createBookingRequest(data),
  getBookingRequests: () => apiClient.getBookingRequests(),
  getMyBookingRequests: () => apiClient.getMyBookingRequests(),
  approveBooking: (data: any) => apiClient.approveBooking(data),
  rejectBooking: (data: any) => apiClient.rejectBooking(data),
  
  // My bookings
  getMyBookings: () => apiClient.getMyBookings(),
  cancelBooking: (data: any) => apiClient.cancelBooking(data),
  rescheduleBooking: (data: any) => apiClient.rescheduleBooking(data),
  
  // Available slots
  getAvailableSlots: (trainerId: number, startDate: string, endDate: string, durationMinutes: number = 60) => 
    apiClient.getAvailableSlots(trainerId, startDate, endDate, durationMinutes),
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
  // **NEW MVP METHODS**
  getUserConversations: (userId: number) => apiClient.getUserConversations(userId),
  getConversationHistory: (userAId: number, userBId: number) => apiClient.getConversationHistory(userAId, userBId),
  markConversationRead: (senderId: number, recipientId: number) => apiClient.markConversationRead(senderId, recipientId),
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
    fetch(`${API_BASE_URL}/time-slots/trainer/${trainerId}/available?date=${date}&duration_minutes=${durationMinutes}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(response => {
      if (!response.ok) {
        return response.json().then(error => Promise.reject(new Error(error.detail || `HTTP ${response.status}`)));
      }
      return response.json();
    }),
  book: (data: any) => apiClient.bookTimeSlot(data),
  createBulk: (data: any) => apiClient.createBulkTimeSlots(data),
  getTrainerSlots: (trainerId: number, startDate: string, endDate: string) => 
    apiClient.getTrainerTimeSlots(trainerId, startDate, endDate),
  update: (slotId: number, data: any) => apiClient.updateTimeSlot(slotId, data),
  delete: (slotId: number) => apiClient.deleteTimeSlot(slotId),
};

export const trainerRegistration = {
  getProfileStatus: () => apiClient.getProfileStatus(),
  getRegistrationProgress: () => apiClient.getRegistrationProgress(),
  completeRegistration: (data: any) => apiClient.completeRegistration(data),
};

export const bookingRequests = {
  getAll: (params?: any) => apiClient.getAllBookingRequests(params),
  getById: (id: number) => apiClient.getBookingRequestById(id),
  create: (data: any) => apiClient.createBookingRequestOld(data),
  approve: (id: number, data: any) => apiClient.approveBookingRequest(id, data),
  update: (id: number, data: any) => apiClient.updateBookingRequest(id, data),
  cancel: (id: number) => apiClient.cancelBookingRequest(id),
};

export const payments = {
  create: (data: any) => apiClient.createPayment(data),
  getAll: (status?: string) => apiClient.getPayments(status),
  getMyPayments: () => apiClient.getMyPayments(),
  getById: (id: number) => apiClient.getPaymentById(id),
  getStats: () => apiClient.getPaymentStats(),
  refund: (data: any) => apiClient.refundPayment(data),
};

export const trainerProfile = {
  getMyProfile: () => apiClient.getMyTrainerProfile(),
  updateBasicInfo: (data: any) => apiClient.updateBasicInfo(data),
  updateTrainingInfo: (data: any) => apiClient.updateTrainingInfo(data),
  updateGymInfo: (data: any) => apiClient.updateGymInfo(data),
  updatePricing: (data: any) => apiClient.updatePricing(data),
};

export const schedulingPreferences = {
  get: () => apiClient.getSchedulingPreferences(),
  update: (data: any) => apiClient.updateSchedulingPreferences(data),
  reset: () => apiClient.resetSchedulingPreferences(),
};

