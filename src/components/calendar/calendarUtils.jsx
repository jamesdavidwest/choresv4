// Date formatting and manipulation functions
export const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

// Convert chore to calendar event
export const choreToEvent = (chore) => {
  return {
    id: chore.id.toString(),
    title: chore.name,
    start: formatDate(chore.due_date || new Date()),
    allDay: true,
    className: `chore-${chore.frequency_id}`, // Will be used for styling based on frequency
    extendedProps: {
      location_id: chore.location_id,
      assigned_to: chore.assigned_to,
      frequency_id: chore.frequency_id,
    }
  };
};

// Calculate next occurrence based on frequency
export const calculateNextOccurrence = (currentDate, frequencyType) => {
  const date = new Date(currentDate);
  
  switch (frequencyType) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      return currentDate;
  }
  
  return formatDate(date);
};

// Group events by assignee
export const groupEventsByAssignee = (events) => {
  return events.reduce((groups, event) => {
    const assigneeId = event.extendedProps?.assigned_to;
    if (!groups[assigneeId]) {
      groups[assigneeId] = [];
    }
    groups[assigneeId].push(event);
    return groups;
  }, {});
};