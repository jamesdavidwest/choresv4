// src/constants/taskConstants.js

export const FREQUENCY_NAMES = {
  1: 'Daily',
  2: 'Weekly',
  3: 'Monthly',
  4: 'Quarterly',
  5: 'Yearly',
  6: 'Once'
};

export const LOCATION_NAMES = {
  1: 'Kitchen',
  2: 'Bathroom',
  3: 'Living Room',
  4: 'Bedroom',
  5: 'Hallway',
  6: 'Den',
  7: 'House',
  8: 'Yard'
};

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER'
};

export const USERS = {
  1: { name: 'David', role: USER_ROLES.ADMIN },
  2: { name: 'Angela', role: USER_ROLES.MANAGER },
  3: { name: 'Dodie', role: USER_ROLES.MANAGER },
  4: { name: 'Sadie', role: USER_ROLES.USER },
  5: { name: 'Sami', role: USER_ROLES.USER }
};

export const DEFAULT_TIME = '09:00:00'; // 9:00 AM - updated to match backend time format

export const STATUS_COLORS = {
  completed: {
    bg: 'bg-green-500',
    text: 'text-green-400',
    border: 'border-green-500'
  },
  overdue: {
    bg: 'bg-red-500',
    text: 'text-red-400',
    border: 'border-red-500'
  },
  active: {
    bg: 'bg-blue-500',
    text: 'text-blue-400',
    border: 'border-blue-500'
  },
  pending: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-400',
    border: 'border-yellow-500'
  },
  verified: {
    bg: 'bg-purple-500',
    text: 'text-purple-400',
    border: 'border-purple-500'
  },
  failed: {
    bg: 'bg-red-700',
    text: 'text-red-600',
    border: 'border-red-700'
  }
};

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  VERIFIED: 'verified',
  FAILED: 'failed'
};

export const defaultTask = {
  name: '',
  frequency_id: 1,
  location_id: 1,
  notes: '',
  is_complete: false,
  time_preference: DEFAULT_TIME,
  assigned_to: 1,  // Default to first user
  priority: 2,     // Medium priority
  estimated_duration: 30, // 30 minutes
  requires_verification: false,
  requires_photo: false
};

export const PRIORITY_LEVELS = {
  1: 'High',
  2: 'Medium',
  3: 'Low',
  4: 'Optional',
  5: 'Backlog'
};

export const PRIORITY_COLORS = {
  1: 'bg-red-100 text-red-800',
  2: 'bg-yellow-100 text-yellow-800',
  3: 'bg-blue-100 text-blue-800',
  4: 'bg-green-100 text-green-800',
  5: 'bg-gray-100 text-gray-800'
};