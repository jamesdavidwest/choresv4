export const transformChoreToEvent = (chore) => {
  if (!chore) {
    console.warn('Received undefined/null chore');
    return null;
  }

  const event = {
    id: chore.id?.toString(),
    title: chore.name || 'Unnamed Chore',
    start: new Date(),
    end: new Date(),
    allDay: true,
    extendedProps: {
      frequency: chore.frequency_id,
      location: chore.location_id,
      assignedTo: chore.assigned_to,
      isComplete: chore.is_complete
    }
  };

  return event;
};