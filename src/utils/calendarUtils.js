import { format, parseISO } from 'date-fns';

const USERS = {
    1: { name: 'David', role: 'ADMIN' },
    2: { name: 'Angela', role: 'MANAGER' },
    3: { name: 'Dodie', role: 'MANAGER' },
    4: { name: 'Sadie', role: 'USER' },
    5: { name: 'Sami', role: 'USER' }
};

export const getEventStyle = (event) => {
    const isComplete = event.extendedProps?.isComplete || event.extendedProps?.is_complete;
    const baseClasses = 'rounded-lg shadow-sm border-l-4 px-2 py-1 min-h-[4rem] flex flex-col justify-between';
    const statusColor = isComplete ? 'bg-green-500/80' : 'bg-blue-500/80';
    return `${baseClasses} ${statusColor}`;
};

export const getAssigneeName = (assignedTo) => {
    return USERS[assignedTo]?.name || 'Unassigned';
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
    if (typeof date === 'string') {
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        // Otherwise, parse and format
        return format(parseISO(date), 'yyyy-MM-dd');
    }
    // If it's a Date object
    return format(date, 'yyyy-MM-dd');
};

export const formatTimeForApi = (date) => {
    if (!date) return null;
    if (typeof date === 'string') {
        // If it's already in HH:mm format, return as is
        if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(date)) return date;
        // Otherwise, parse and format
        return format(parseISO(date), 'HH:mm');
    }
    // If it's a Date object
    return format(date, 'HH:mm');
};

export const transformEventForModal = (event) => {
    if (!event) return null;
    
    console.log('Transforming event:', event);
    const isInstance = event.extendedProps?.instanceId != null;
    
    return {
        id: parseInt(event.extendedProps.choreId),
        instanceId: isInstance ? parseInt(event.extendedProps.instanceId) : null,
        name: event.title,
        frequency_id: event.extendedProps.frequencyId,
        location_id: event.extendedProps.locationId,
        assigned_to: event.extendedProps.assignedTo,
        is_complete: isInstance 
            ? Boolean(event.extendedProps.isComplete)
            : Boolean(event.extendedProps.is_complete),
        completed_at: event.extendedProps.completedAt,
        completed_by: event.extendedProps.completedBy,
        last_completed: event.extendedProps.lastCompleted,
        start_date: event.extendedProps.startDate,
        end_date: event.extendedProps.endDate,
        due_time: event.extendedProps.dueTime,
        notes: event.extendedProps.notes || ''
    };
};

export const transformChoresToEvents = (chores) => {
    if (!Array.isArray(chores)) return [];
    
    console.log('Transforming chores to events:', chores);
    
    return chores.flatMap(chore => {
        const baseEventProps = {
            id: chore.id.toString(),
            title: chore.name,
            allDay: !chore.due_time,
            className: `chore-${chore.frequency_id}`,
            extendedProps: {
                choreId: chore.id,
                locationId: chore.location_id,
                assignedTo: chore.assigned_to,
                frequencyId: chore.frequency_id,
                notes: chore.notes,
                is_complete: chore.is_complete,
                startDate: chore.start_date,
                endDate: chore.end_date,
                dueTime: chore.due_time
            }
        };

        if (chore.instances && Array.isArray(chore.instances) && chore.instances.length > 0) {
            return chore.instances.map(instance => ({
                ...baseEventProps,
                id: `${chore.id}-${instance.id}`,
                start: instance.due_date + (chore.due_time ? `T${chore.due_time}` : ''),
                extendedProps: {
                    ...baseEventProps.extendedProps,
                    instanceId: instance.id,
                    isComplete: instance.is_complete,
                    completedAt: instance.completed_at,
                    completedBy: instance.completed_by,
                    lastCompleted: chore.last_completed
                }
            }));
        }

        return [{
            ...baseEventProps,
            start: chore.start_date + (chore.due_time ? `T${chore.due_time}` : ''),
            end: chore.end_date + (chore.due_time ? `T${chore.due_time}` : ''),
            extendedProps: {
                ...baseEventProps.extendedProps,
                isComplete: chore.is_complete,
                lastCompleted: chore.last_completed
            }
        }];
    });
};