// TypeScript types for FitConnect application

export type Specialty = 
  | 'Strength Training'
  | 'Weight Loss'
  | 'Yoga'
  | 'Rehabilitation'
  | 'Sports Performance'
  | 'Prenatal Fitness';

export type Availability = 
  | 'Morning'
  | 'Afternoon'
  | 'Evening'
  | 'Weekends';

export type SessionStatus = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';

export type ProgramStatus = 'Active' | 'Completed' | 'Paused';

export interface Trainer {
  id: string;
  name: string;
  avatar: string;
  cover: string;
  specialty: Specialty;
  rating: number;
  reviews: number;
  price: number;
  blurb: string;
  availability: Availability[];
}

export interface Session {
  id: string;
  title: string;
  status: SessionStatus;
  trainerName: string;
  trainerAvatar: string;
  location: string;
  datetime: string;
  duration: number; // in minutes
}

export interface Message {
  id: string;
  sender: string;
  senderAvatar: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

export interface Program {
  id: string;
  title: string;
  trainerName: string;
  trainerAvatar: string;
  status: ProgramStatus;
  description: string;
  duration: string; // e.g., "8 weeks"
  exercises: string[];
  startDate: string;
  endDate: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'client' | 'trainer' | 'admin';
}

export interface StatCard {
  id: string;
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: string;
  color: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  quote: string;
  rating: number;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

// Scheduling Algorithm Types
export type OptimizationCriteria = 
  | 'minimize_travel_time'
  | 'maximize_trainer_utilization'
  | 'minimize_conflicts'
  | 'balance_workload'
  | 'prioritize_premium_clients';

export type SchedulingConstraint = 
  | 'trainer_availability'
  | 'client_preferences'
  | 'location_constraints'
  | 'equipment_availability'
  | 'session_duration'
  | 'time_buffer';

export interface SchedulingRequest {
  id: string;
  clientId: string;
  trainerId: string;
  preferredTimes: string[];
  sessionType: string;
  duration: number;
  location: string;
  priority: 'high' | 'medium' | 'low';
  constraints: SchedulingConstraint[];
}

export interface SchedulingConflict {
  id: string;
  type: 'time_overlap' | 'location_conflict' | 'trainer_unavailable' | 'client_conflict';
  severity: 'high' | 'medium' | 'low';
  description: string;
  affectedSessions: string[];
  suggestedSolutions: string[];
}

export interface OptimizationResult {
  id: string;
  algorithm: string;
  criteria: OptimizationCriteria[];
  score: number;
  conflicts: SchedulingConflict[];
  totalSessions: number;
  utilizationRate: number;
  averageTravelTime: number;
  createdAt: string;
  sessions: OptimizedSession[];
}

export interface OptimizedSession {
  id: string;
  clientId: string;
  trainerId: string;
  sessionType: string;
  startTime: string;
  endTime: string;
  location: string;
  duration: number;
  confidence: number;
  conflicts: string[];
}

export interface AlgorithmConfig {
  criteria: OptimizationCriteria[];
  constraints: SchedulingConstraint[];
  timeBuffer: number; // minutes
  maxTravelTime: number; // minutes
  workingHours: {
    start: string;
    end: string;
  };
  daysOfWeek: string[];
  optimizationLevel: 'fast' | 'balanced' | 'thorough';
}
