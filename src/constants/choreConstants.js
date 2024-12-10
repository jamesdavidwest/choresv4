import { format } from 'date-fns';

export const FREQUENCY_NAMES = {
  1: 'Daily',
  2: 'Weekly',
  3: 'Monthly',
  4: 'Quarterly',
  5: 'Yearly',
  6: "Once"
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

export const USERS = {
  1: { name: 'David', role: 'ADMIN' },
  2: { name: 'Angela', role: 'MANAGER' },
  3: { name: 'Dodie', role: 'MANAGER' },
  4: { name: 'Sadie', role: 'USER' },
  5: { name: 'Sami', role: 'USER' }
};

export const DEFAULT_TIME = '21:00'; // 9:00 PM

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
  skipped: {
    bg: 'bg-gray-500',
    text: 'text-gray-400',
    border: 'border-gray-500'
  }
};

export const defaultChore = {
  name: '',
  frequency_id: 1,
  location_id: 1,
  notes: '',
  is_complete: false,
  due_date: format(new Date(), 'yyyy-MM-dd'),
  due_time: DEFAULT_TIME,
  assigned_to: 1  // Default to first user
};
