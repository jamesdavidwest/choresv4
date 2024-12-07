// Date formatting and manipulation functions
export const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

// Convert chore to calendar event
export const choreToEvent = (chore, instance = null) => {
  return {
    id: instance ? `${chore.id}-${instance.id}` : chore.id.toString(),
    title: chore.name,
    start: instance ? instance.due_date : (chore.due_date || new Date().toISOString().split('T')[0]),
    allDay: true,
    className: `chore-${chore.frequency_id}`, // Will be used for styling based on frequency
    extendedProps: {
      choreId: chore.id,
      instanceId: instance?.id,
      locationId: chore.location_id,
      assignedTo: chore.assigned_to,
      frequencyId: chore.frequency_id,
      isComplete: instance ? instance.is_complete : chore.is_complete,
      lastCompleted: instance ? instance.completed_at : chore.last_completed,
      completedBy: instance ? instance.completed_by : null
    }
  };
};

// Transform chores and their instances into calendar events
export const transformChoresToEvents = (chores) => {
  return chores.flatMap(chore => {
    if (chore.instances && chore.instances.length > 0) {
      // Create events from instances
      return chore.instances.map(instance => choreToEvent(chore, instance));
    } else {
      // Fallback to creating a single event from the chore itself
      return [choreToEvent(chore)];
    }
  });
};

// Group events by assignee
export const groupEventsByAssignee = (events) => {
  return events.reduce((groups, event) => {
    const assigneeId = event.extendedProps?.assignedTo;
    if (!groups[assigneeId]) {
      groups[assigneeId] = [];
    }
    groups[assigneeId].push(event);
    return groups;
  }, {});
};