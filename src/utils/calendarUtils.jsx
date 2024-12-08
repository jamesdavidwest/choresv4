import { format, parseISO } from 'date-fns';

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

export const getEventStyle = (event) => {
    const status = event.extendedProps?.status || 'upcoming';
    const baseClasses = 'rounded-lg shadow-sm border-l-4 px-2 py-1';
    const statusColor = getStatusColor(status);
    
    return `${baseClasses} ${statusColor}`;
};

export const transformEventForModal = (event) => {
    if (!event) return null;
    
    return {
        id: parseInt(event.extendedProps.choreId),
        instanceId: parseInt(event.extendedProps.instanceId),
        name: event.title,
        status: event.extendedProps.status,
        location: event.extendedProps.location,
        assignedTo: event.extendedProps.assignedTo,
        frequency: event.extendedProps.frequency,
        isComplete: event.extendedProps.isComplete,
        completedAt: event.extendedProps.completedAt,
        completedBy: event.extendedProps.completedBy,
        dueDate: formatDateForApi(event.start),
        dueTime: formatTimeForApi(event.start)
    };
};