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
  1: { name: 'David' },
  2: { name: 'Angela' },
  3: { name: 'Dodie' },
  4: { name: 'Sadie' },
  5: { name: 'Sami' }
};

export const DEFAULT_TIME = '21:00'; // 9:00 PM

export const defaultChore = {
  name: '',
  frequency_id: 1,
  location_id: 1,
  notes: '',
  is_complete: false,
  due_date: format(new Date(), 'yyyy-MM-dd'),
  due_time: DEFAULT_TIME
};
