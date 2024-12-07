export const transformChoresToEvents = (chores) => {
  return chores.flatMap(chore => {
    if (chore.instances && chore.instances.length > 0) {
      // Create events from instances
      return chore.instances.map(instance => ({
        id: `${chore.id}-${instance.id}`,
        title: chore.name,
        start: instance.due_date,
        allDay: true,
        className: `chore-${chore.frequency_id}`,
        extendedProps: {
          choreId: chore.id,
          instanceId: instance.id,
          locationId: chore.location_id,
          assignedTo: chore.assigned_to,
          frequencyId: chore.frequency_id,
          isComplete: instance.is_complete,
          lastCompleted: instance.completed_at,
          completedBy: instance.completed_by
        }
      }));
    } else {
      // Fallback to single event from chore
      return [{
        id: chore.id.toString(),
        title: chore.name,
        start: chore.due_date,
        allDay: true,
        className: `chore-${chore.frequency_id}`,
        extendedProps: {
          choreId: chore.id,
          locationId: chore.location_id,
          assignedTo: chore.assigned_to,
          frequencyId: chore.frequency_id,
          isComplete: chore.is_complete,
          lastCompleted: chore.last_completed
        }
      }];
    }
  });
};
