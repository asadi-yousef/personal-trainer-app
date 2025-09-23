// Mock data for FitConnect application
import { 
  Trainer, 
  Session, 
  Message, 
  Program, 
  User, 
  StatCard, 
  Testimonial, 
  Feature 
} from './types';

export const mockTrainers: Trainer[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'https://i.pravatar.cc/200?img=1',
    cover: 'https://picsum.photos/seed/fit1/640/360',
    specialty: 'Strength Training',
    rating: 4.9,
    reviews: 127,
    price: 85,
    blurb: 'Certified strength coach with 8+ years experience helping clients build muscle and confidence.',
    availability: ['Morning', 'Evening', 'Weekends']
  },
  {
    id: '2',
    name: 'Michael Chen',
    avatar: 'https://i.pravatar.cc/200?img=2',
    cover: 'https://picsum.photos/seed/fit2/640/360',
    specialty: 'Weight Loss',
    rating: 4.8,
    reviews: 89,
    price: 75,
    blurb: 'Weight loss specialist focusing on sustainable lifestyle changes and metabolic conditioning.',
    availability: ['Morning', 'Afternoon']
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    avatar: 'https://i.pravatar.cc/200?img=3',
    cover: 'https://picsum.photos/seed/fit3/640/360',
    specialty: 'Yoga',
    rating: 4.9,
    reviews: 156,
    price: 65,
    blurb: '500-hour certified yoga instructor specializing in vinyasa flow and mindfulness practices.',
    availability: ['Morning', 'Evening']
  },
  {
    id: '4',
    name: 'David Thompson',
    avatar: 'https://i.pravatar.cc/200?img=4',
    cover: 'https://picsum.photos/seed/fit4/640/360',
    specialty: 'Rehabilitation',
    rating: 4.7,
    reviews: 92,
    price: 95,
    blurb: 'Physical therapist and corrective exercise specialist helping clients recover from injuries.',
    availability: ['Afternoon', 'Evening']
  },
  {
    id: '5',
    name: 'Lisa Park',
    avatar: 'https://i.pravatar.cc/200?img=5',
    cover: 'https://picsum.photos/seed/fit5/640/360',
    specialty: 'Sports Performance',
    rating: 4.8,
    reviews: 73,
    price: 110,
    blurb: 'Former collegiate athlete and performance coach specializing in athletic development.',
    availability: ['Morning', 'Weekends']
  },
  {
    id: '6',
    name: 'Jessica Williams',
    avatar: 'https://i.pravatar.cc/200?img=6',
    cover: 'https://picsum.photos/seed/fit6/640/360',
    specialty: 'Prenatal Fitness',
    rating: 4.9,
    reviews: 45,
    price: 80,
    blurb: 'Certified prenatal and postnatal fitness specialist supporting mothers through their journey.',
    availability: ['Morning', 'Afternoon']
  }
];

export const mockSessions: Session[] = [
  {
    id: '1',
    title: 'Upper Body Strength',
    status: 'Confirmed',
    trainerName: 'Sarah Johnson',
    trainerAvatar: 'https://i.pravatar.cc/200?img=1',
    location: 'Downtown Fitness Center',
    datetime: '2024-01-15T10:00:00Z',
    duration: 60
  },
  {
    id: '2',
    title: 'Cardio HIIT',
    status: 'Pending',
    trainerName: 'Michael Chen',
    trainerAvatar: 'https://i.pravatar.cc/200?img=2',
    location: 'Home Session',
    datetime: '2024-01-18T14:00:00Z',
    duration: 45
  },
  {
    id: '3',
    title: 'Yoga Flow',
    status: 'Confirmed',
    trainerName: 'Emma Rodriguez',
    trainerAvatar: 'https://i.pravatar.cc/200?img=3',
    location: 'Zen Yoga Studio',
    datetime: '2024-01-20T09:00:00Z',
    duration: 75
  },
  {
    id: '4',
    title: 'Rehabilitation Session',
    status: 'Confirmed',
    trainerName: 'David Thompson',
    trainerAvatar: 'https://i.pravatar.cc/200?img=4',
    location: 'Physical Therapy Clinic',
    datetime: '2024-01-22T16:00:00Z',
    duration: 60
  }
];

export const mockMessages: Message[] = [
  {
    id: '1',
    sender: 'Sarah Johnson',
    senderAvatar: 'https://i.pravatar.cc/200?img=1',
    lastMessage: 'Great session today! Remember to hydrate well.',
    timestamp: '2024-01-14T18:30:00Z',
    unread: false
  },
  {
    id: '2',
    sender: 'Michael Chen',
    senderAvatar: 'https://i.pravatar.cc/200?img=2',
    lastMessage: 'Your nutrition plan is ready for review.',
    timestamp: '2024-01-14T15:20:00Z',
    unread: true
  },
  {
    id: '3',
    sender: 'Emma Rodriguez',
    senderAvatar: 'https://i.pravatar.cc/200?img=3',
    lastMessage: 'See you tomorrow for our yoga session!',
    timestamp: '2024-01-14T12:45:00Z',
    unread: false
  }
];

export const mockProgram: Program = {
  id: '1',
  title: '12-Week Strength Transformation',
  trainerName: 'Sarah Johnson',
  trainerAvatar: 'https://i.pravatar.cc/200?img=1',
  status: 'Active',
  description: 'Comprehensive strength training program designed to build muscle mass and increase overall strength.',
  duration: '12 weeks',
  exercises: [
    'Deadlifts - 3 sets x 5 reps',
    'Squats - 3 sets x 8 reps',
    'Bench Press - 3 sets x 6 reps',
    'Pull-ups - 3 sets x max reps',
    'Overhead Press - 3 sets x 8 reps'
  ],
  startDate: '2024-01-01',
  endDate: '2024-03-25'
};

export const mockUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'https://i.pravatar.cc/200?img=7',
  role: 'client'
};

export const mockStats: StatCard[] = [
  {
    id: '1',
    title: 'Sessions Completed',
    value: '24',
    change: '+12%',
    changeType: 'increase',
    icon: 'check-circle',
    color: 'green'
  },
  {
    id: '2',
    title: 'Current Weight',
    value: '165 lbs',
    change: '-5 lbs',
    changeType: 'decrease',
    icon: 'trending-down',
    color: 'blue'
  },
  {
    id: '3',
    title: 'Goal Progress',
    value: '68%',
    change: '+8%',
    changeType: 'increase',
    icon: 'target',
    color: 'purple'
  },
  {
    id: '4',
    title: 'Next Session',
    value: 'Tomorrow',
    change: '10:00 AM',
    icon: 'clock',
    color: 'indigo'
  }
];

export const mockTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Alex Martinez',
    role: 'Software Engineer',
    avatar: 'https://i.pravatar.cc/200?img=8',
    quote: 'FitConnect helped me find the perfect trainer for my busy schedule. The results speak for themselves!',
    rating: 5
  },
  {
    id: '2',
    name: 'Rachel Green',
    role: 'Marketing Manager',
    avatar: 'https://i.pravatar.cc/200?img=9',
    quote: 'I love how easy it is to book sessions and track my progress. My trainer Sarah is amazing!',
    rating: 5
  },
  {
    id: '3',
    name: 'Tom Wilson',
    role: 'Entrepreneur',
    avatar: 'https://i.pravatar.cc/200?img=10',
    quote: 'The personalized programs and flexible scheduling make FitConnect the best fitness platform I\'ve used.',
    rating: 5
  }
];

export const mockFeatures: Feature[] = [
  {
    id: '1',
    title: 'Easy Scheduling',
    description: 'Book sessions with your preferred trainer in just a few clicks.',
    icon: 'calendar'
  },
  {
    id: '2',
    title: 'Custom Programs',
    description: 'Get personalized workout plans tailored to your goals and fitness level.',
    icon: 'clipboard'
  },
  {
    id: '3',
    title: 'Progress Tracking',
    description: 'Monitor your fitness journey with detailed analytics and insights.',
    icon: 'trending-up'
  },
  {
    id: '4',
    title: 'Direct Communication',
    description: 'Stay connected with your trainer through our built-in messaging system.',
    icon: 'message-square'
  }
];

// Trainer Dashboard Data
export const mockTrainerUser: User = {
  id: '2',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@example.com',
  avatar: 'https://i.pravatar.cc/200?img=1',
  role: 'trainer'
};

export const mockTrainerStats: StatCard[] = [
  {
    id: '1',
    title: 'Total Clients',
    value: '24',
    change: '+3 this month',
    changeType: 'increase',
    icon: 'users',
    color: 'green'
  },
  {
    id: '2',
    title: 'Sessions This Week',
    value: '18',
    change: '+5 from last week',
    changeType: 'increase',
    icon: 'calendar',
    color: 'blue'
  },
  {
    id: '3',
    title: 'Monthly Earnings',
    value: '$2,450',
    change: '+12%',
    changeType: 'increase',
    icon: 'dollar-sign',
    color: 'purple'
  },
  {
    id: '4',
    title: 'Average Rating',
    value: '4.9',
    change: 'Based on 127 reviews',
    changeType: 'increase',
    icon: 'star',
    color: 'indigo'
  }
];

export interface Booking {
  id: string;
  clientName: string;
  clientAvatar: string;
  sessionType: string;
  status: SessionStatus;
  datetime: string;
  duration: number;
  location: string;
}

export const mockTrainerBookings: Booking[] = [
  {
    id: '1',
    clientName: 'John Doe',
    clientAvatar: 'https://i.pravatar.cc/200?img=7',
    sessionType: 'Upper Body Strength',
    status: 'Confirmed',
    datetime: '2024-01-15T10:00:00Z',
    duration: 60,
    location: 'Downtown Fitness Center'
  },
  {
    id: '2',
    clientName: 'Emma Wilson',
    clientAvatar: 'https://i.pravatar.cc/200?img=8',
    sessionType: 'Cardio HIIT',
    status: 'Pending',
    datetime: '2024-01-16T14:00:00Z',
    duration: 45,
    location: 'Home Session'
  },
  {
    id: '3',
    clientName: 'Mike Chen',
    clientAvatar: 'https://i.pravatar.cc/200?img=9',
    sessionType: 'Strength Training',
    status: 'Confirmed',
    datetime: '2024-01-17T09:00:00Z',
    duration: 75,
    location: 'Gym Studio'
  }
];

export interface TrainerProgram {
  id: string;
  title: string;
  clientName: string;
  clientAvatar: string;
  status: ProgramStatus;
  duration: string;
  sessionsCompleted: number;
  totalSessions: number;
}

export const mockTrainerPrograms: TrainerProgram[] = [
  {
    id: '1',
    title: '12-Week Strength Transformation',
    clientName: 'John Doe',
    clientAvatar: 'https://i.pravatar.cc/200?img=7',
    status: 'Active',
    duration: '12 weeks',
    sessionsCompleted: 8,
    totalSessions: 24
  },
  {
    id: '2',
    title: 'Weight Loss Program',
    clientName: 'Emma Wilson',
    clientAvatar: 'https://i.pravatar.cc/200?img=8',
    status: 'Active',
    duration: '8 weeks',
    sessionsCompleted: 5,
    totalSessions: 16
  }
];

// Admin Dashboard Data
export const mockAdminUser: User = {
  id: '3',
  name: 'Admin User',
  email: 'admin@fitconnect.com',
  avatar: 'https://i.pravatar.cc/200?img=11',
  role: 'admin'
};

export const mockAdminStats: StatCard[] = [
  {
    id: '1',
    title: 'Total Users',
    value: '1,247',
    change: '+89 this month',
    changeType: 'increase',
    icon: 'users',
    color: 'green'
  },
  {
    id: '2',
    title: 'Active Trainers',
    value: '156',
    change: '+12 new trainers',
    changeType: 'increase',
    icon: 'user-check',
    color: 'blue'
  },
  {
    id: '3',
    title: 'Monthly Revenue',
    value: '$45,230',
    change: '+18% from last month',
    changeType: 'increase',
    icon: 'dollar-sign',
    color: 'purple'
  },
  {
    id: '4',
    title: 'Platform Uptime',
    value: '99.9%',
    change: 'Last 30 days',
    changeType: 'increase',
    icon: 'activity',
    color: 'indigo'
  }
];

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://i.pravatar.cc/200?img=7',
    role: 'client'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    avatar: 'https://i.pravatar.cc/200?img=1',
    role: 'trainer'
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike.chen@example.com',
    avatar: 'https://i.pravatar.cc/200?img=2',
    role: 'trainer'
  },
  {
    id: '4',
    name: 'Emma Wilson',
    email: 'emma.wilson@example.com',
    avatar: 'https://i.pravatar.cc/200?img=8',
    role: 'client'
  },
  {
    id: '5',
    name: 'David Thompson',
    email: 'david.thompson@example.com',
    avatar: 'https://i.pravatar.cc/200?img=4',
    role: 'trainer'
  }
];

