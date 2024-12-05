import { addDays, addWeeks, addMonths, addYears, startOfDay, endOfDay } from 'date-fns';

// Color mappings for different chore states
const CHORE_COLORS = {
  completed: '#4CAF50',  // Green
  overdue: '#F44336',    // Red
  upcoming: '#2196F3',   // Blue
  daily: '#90CAF9',      // Light Blue
  weekly: '#81C784',     // Light Green
  monthly: '#FFB74D',    // Orange
  quarterly: '#BA68C8',  // Purple
  yearly: '#F06292'      // Pink
};

// Frequency ID mappings (based on your frequency_types data)
const FREQUENCY_TYPES = {
  1: { name: 'daily', addFn: addDays, interval: 1 },
  2: { name: 'weekly', addFn: addWeeks, interval: 1 },
  3: { name: 'monthly', addFn: addMonths, interval: 1 },
  4: { name: 'quarterly', addFn: addMonths, interval: 3 },
  5: { name: 'yearly', addFn: addYears, interval: 1 }
};

const getEventColor = (chore) => {
  if (chore.is_complete) return CHORE_COLORS.completed;
  
  const now = new Date();
  const dueDate = new Date(chore.due_date);
  
  if (dueDate < now) return CHORE_COLORS.overdue;
  
  // Return color based on frequency if not overdue or completed
  const frequencyType = FREQUENCY_TYPES[chore.frequency_id];
  return CHORE_COLORS[frequencyType?.name] || CHORE_COLORS.upcoming;
};

const generateRecurringEvents = (chore, startRange, endRange) => {
  const events = [];
  const frequencyType = FREQUENCY_TYPES[chore.frequency_id];
  
  if (!frequencyType) {
    console.warn(`Unknown frequency type: ${chore.frequency_id}`);
    return events;
  }

  let currentDate = startOfDay(new Date(startRange));
  const rangeEnd = endOfDay(new Date(endRange));
  
  while (currentDate <= rangeEnd) {
    events.push({
      id: `${chore.id}-${currentDate.toISOString()}`,
      title: chore.name,
      start: currentDate,
      end: endOfDay(currentDate),
      allDay: true,
      backgroundColor: getEventColor(chore),
      borderColor: getEventColor(chore),
      extendedProps: {
        choreId: chore.id,
        frequency: chore.frequency_id,
        location: chore.location_id,
        assignedTo: chore.assigned_to,
        isComplete: chore.is_complete
      }
    });
    
    currentDate = frequencyType.addFn(currentDate, frequencyType.interval);
  }
  
  return events;
};

export const transformChoreToEvent = (chore, viewStart, viewEnd) => {
  if (!chore) {
    console.warn('Received undefined/null chore');
    return null;
  }

  // If no date range is provided, default to current month
  const start = viewStart || startOfDay(new Date());
  const end = viewEnd || endOfDay(addMonths(start, 1));

  return generateRecurringEvents(chore, start, end);
};

export const transformChoresToEvents = (chores, viewStart, viewEnd) => {
  if (!Array.isArray(chores)) {
    console.warn('Expected array of chores, received:', typeof chores);
    return [];
  }

  return chores.flatMap(chore => transformChoreToEvent(chore, viewStart, viewEnd));
};