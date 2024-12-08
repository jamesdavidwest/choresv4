import { format, parseISO } from 'date-fns';

export const getEventStyle = (event) => {
    const status = event.extendedProps?.status || 'upcoming';
    const baseClasses = 'rounded-lg shadow-sm border-l-4 px-2 py-1';
    const statusColor = getStatusColor(status);
    return `${baseClasses} ${statusColor}`;
};

export const getStatusColor = (status) => {
    switch (status) {
        case 'completed':
            return 'bg-green-500';
        case 'overdue':
            return 'bg-red-500';
        case 'upcoming':
            return 'bg-blue-500';
        default:
            return 'bg-gray-500';
    }
};

export const formatEventDate = (dateStr) => {
    if (!dateStr) return '';
    try {
        return format(parseISO(dateStr), 'PPP');
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateStr;
    }
};

export const formatEventTime = (dateStr) => {
    if (!dateStr) return '';
    try {
        return format(parseISO(dateStr), 'h:mm a');
    } catch (error) {
        console.error('Error formatting time:', error);
        return dateStr;
    }
};

export const formatDateForApi = (date) => {
    if (!date) return null;
    return format(typeof date === 'string' ? parseISO(date) : date, 'yyyy-MM-dd');
};

export const formatTimeForApi = (date) => {
    if (!date) return null;
    return format(typeof date === 'string' ? parseISO(date) : date, 'HH:mm:ss');
};

export const transformEventForModal = (event) => {
    if (!event) return null;
    
    return {
        id: parseInt(event.extendedProps.choreId),
        instanceId: parseInt(event.extendedProps.instanceId),
        name: event.title,
        frequency_id: event.extendedProps.frequencyId,
        location_id: event.extendedProps.locationId,
        assigned_to: event.extendedProps.assignedTo,
        is_complete: event.extendedProps.isComplete,
        completed_at: event.extendedProps.completedAt,
        completed_by: event.extendedProps.completedBy,
        due_date: formatDateForApi(event.start),
        due_time: formatTimeForApi(event.start),
        notes: event.extendedProps.notes || ''
    };
};

export const transformChoresToEvents = (chores) => {
    if (!Array.isArray(chores)) return [];
    
    return chores.flatMap(chore => {
        const baseEventProps = {
            id: chore.id.toString(),
            title: chore.name,
            allDay: true,
            className: `chore-${chore.frequency_id}`,
            extendedProps: {
                choreId: chore.id,
                locationId: chore.location_id,
                assignedTo: chore.assigned_to,
                frequencyId: chore.frequency_id
            }
        };

        if (chore.instances && Array.isArray(chore.instances) && chore.instances.length > 0) {
            return chore.instances.map(instance => ({
                ...baseEventProps,
                id: `${chore.id}-${instance.id}`,
                start: instance.due_date,
                extendedProps: {
                    ...baseEventProps.extendedProps,
                    instanceId: instance.id,
                    isComplete: instance.is_complete,
                    lastCompleted: instance.completed_at,
                    completedBy: instance.completed_by
                }
            }));
        }

        return [{
            ...baseEventProps,
            start: chore.due_date,
            extendedProps: {
                ...baseEventProps.extendedProps,
                isComplete: chore.is_complete,
                lastCompleted: chore.last_completed
            }
        }];
    });
};