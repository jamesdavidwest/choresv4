// Date formatting and manipulation functions
export const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

// Convert task to calendar event
export const taskToEvent = (task, instance = null) => {
  return {
    id: instance ? `${task.id}-${instance.id}` : task.id.toString(),
    title: task.name,
    start: instance ? instance.due_date : (task.due_date || new Date().toISOString().split('T')[0]),
    allDay: true,
    className: `task-${task.frequency_id}`, // Will be used for styling based on frequency
    extendedProps: {
      taskId: task.id,
      instanceId: instance?.id,
      locationId: task.location_id,
      assignedTo: task.assigned_to,
      frequencyId: task.frequency_id,
      isComplete: instance ? instance.is_complete : task.is_complete,
      lastCompleted: instance ? instance.completed_at : task.last_completed,
      completedBy: instance ? instance.completed_by : null
    }
  };
};

// Transform tasks and their instances into calendar events
export const transformTasksToEvents = (tasks) => {
  return tasks.flatMap(task => {
    if (task.instances && task.instances.length > 0) {
      // Create events from instances
      return task.instances.map(instance => taskToEvent(task, instance));
    } else {
      // Fallback to creating a single event from the task itself
      return [taskToEvent(task)];
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
