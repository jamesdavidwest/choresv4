import { format, parseISO, isBefore, isAfter, startOfDay } from 'date-fns';
import { USERS, STATUS_COLORS } from '../constants/taskConstants';

// Memoization cache for expensive calculations
const memoCache = new Map();

export const getEventStyle = (event) => {
    const cacheKey = `style-${event.id}-${event.extendedProps?.status || ''}-${event.extendedProps?.skipped || false}`;
    
    if (memoCache.has(cacheKey)) {
        return memoCache.get(cacheKey);
    }
    
    const baseClasses = 'rounded-lg shadow-sm border-l-4 px-2 py-1 min-h-[4rem] flex flex-col justify-between';
    
    // Get status from instance if available
    const status = event.extendedProps?.status || 
                  (event.extendedProps?.isComplete ? 'completed' : 'active');
    
    // Handle skipped instances
    if (event.extendedProps?.skipped) {
        const style = `${baseClasses} bg-gray-400/80`;
        memoCache.set(cacheKey, style);
        return style;
    }

    // Status-based coloring with opacity for better visibility
    const statusColors = {
        'completed': 'bg-green-500/90',
        'active': 'bg-blue-500/90',
        'overdue': 'bg-red-500/90',
        'pending': 'bg-yellow-500/90'
    };

    const style = `${baseClasses} ${statusColors[status] || statusColors.active}`;
    memoCache.set(cacheKey, style);
    return style;
};

export const getAssigneeName = (assignedTo) => {
    const cacheKey = `assignee-${assignedTo}`;
    
    if (memoCache.has(cacheKey)) {
        return memoCache.get(cacheKey);
    }
    
    const name = USERS[assignedTo]?.name || 'Unassigned';
    memoCache.set(cacheKey, name);
    return name;
};

export const getStatusColor = (status) => {
    const cacheKey = `status-color-${status}`;
    
    if (memoCache.has(cacheKey)) {
        return memoCache.get(cacheKey);
    }
    
    let color;
    switch (status) {
        case 'completed':
            color = STATUS_COLORS.completed.bg;
            break;
        case 'overdue':
            color = STATUS_COLORS.overdue.bg;
            break;
        case 'pending':
            color = STATUS_COLORS.pending.bg;
            break;
        case 'active':
            color = STATUS_COLORS.active.bg;
            break;
        default:
            color = STATUS_COLORS.active.bg;
    }
    
    memoCache.set(cacheKey, color);
    return color;
};

// Date formatting utilities with memoization
export const formatEventDate = (dateStr) => {
    if (!dateStr) return '';
    
    const cacheKey = `date-${dateStr}`;
    if (memoCache.has(cacheKey)) {
        return memoCache.get(cacheKey);
    }
    
    try {
        const formatted = format(parseISO(dateStr), 'PPP');
        memoCache.set(cacheKey, formatted);
        return formatted;
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateStr;
    }
};

export const formatEventTime = (dateStr) => {
    if (!dateStr) return '';
    
    const cacheKey = `time-${dateStr}`;
    if (memoCache.has(cacheKey)) {
        return memoCache.get(cacheKey);
    }
    
    try {
        const formatted = format(parseISO(dateStr), 'h:mm a');
        memoCache.set(cacheKey, formatted);
        return formatted;
    } catch (error) {
        console.error('Error formatting time:', error);
        return dateStr;
    }
};

export const formatDateForApi = (date) => {
    if (!date) return null;
    
    const cacheKey = `api-date-${date}`;
    if (memoCache.has(cacheKey)) {
        return memoCache.get(cacheKey);
    }
    
    let formatted;
    if (typeof date === 'string') {
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            formatted = date;
        } else {
            // Otherwise, parse and format
            formatted = format(parseISO(date), 'yyyy-MM-dd');
        }
    } else {
        // If it's a Date object
        formatted = format(date, 'yyyy-MM-dd');
    }
    
    memoCache.set(cacheKey, formatted);
    return formatted;
};

export const formatTimeForApi = (date) => {
    if (!date) return null;
    
    const cacheKey = `api-time-${date}`;
    if (memoCache.has(cacheKey)) {
        return memoCache.get(cacheKey);
    }
    
    let formatted;
    if (typeof date === 'string') {
        // If it's already in HH:mm format, return as is
        if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(date)) {
            formatted = date;
        } else {
            // Otherwise, parse and format
            formatted = format(parseISO(date), 'HH:mm');
        }
    } else {
        // If it's a Date object
        formatted = format(date, 'HH:mm');
    }
    
    memoCache.set(cacheKey, formatted);
    return formatted;
};

export const transformEventForModal = (event) => {
    if (!event) return null;
    
    const cacheKey = `modal-event-${event.id}-${event.extendedProps?.instanceId || ''}`;
    if (memoCache.has(cacheKey)) {
        return memoCache.get(cacheKey);
    }
    
    const isInstance = event.extendedProps?.instanceId != null;
    
    const transformed = {
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
        notes: event.extendedProps.notes || '',
        status: event.extendedProps.status,
        skipped: event.extendedProps.skipped,
        modified_history: event.extendedProps.modifiedHistory
    };
    
    memoCache.set(cacheKey, transformed);
    return transformed;
};

export const determineInstanceStatus = (instance, currentDate = new Date()) => {
    const cacheKey = `instance-status-${instance.id}-${instance.is_complete}-${instance.skipped}-${currentDate.getTime()}`;
    if (memoCache.has(cacheKey)) {
        return memoCache.get(cacheKey);
    }
    
    let status;
    if (instance.is_complete) {
        status = 'completed';
    } else if (instance.skipped) {
        status = 'skipped';
    } else {
        const dueDate = parseISO(instance.due_date);
        const today = startOfDay(currentDate);
        
        if (isBefore(dueDate, today)) {
            status = 'overdue';
        } else if (isAfter(dueDate, today)) {
            status = 'pending';
        } else {
            status = 'active';
        }
    }
    
    memoCache.set(cacheKey, status);
    return status;
};

export const transformChoresToEvents = (chores) => {
    if (!Array.isArray(chores)) return [];
    
    const currentDate = new Date();
    const cacheKey = `chores-transform-${chores.length}-${currentDate.getTime()}`;
    
    if (memoCache.has(cacheKey)) {
        return memoCache.get(cacheKey);
    }
    
    const events = chores.flatMap(chore => {
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
            return chore.instances.map(instance => {
                const status = determineInstanceStatus(instance, currentDate);
                
                return {
                    ...baseEventProps,
                    id: `${chore.id}-${instance.id}`,
                    start: instance.due_date + (chore.due_time ? `T${chore.due_time}` : ''),
                    backgroundColor: STATUS_COLORS[status].bg,
                    borderColor: STATUS_COLORS[status].border,
                    extendedProps: {
                        ...baseEventProps.extendedProps,
                        instanceId: instance.id,
                        isComplete: instance.is_complete,
                        completedAt: instance.completed_at,
                        completedBy: instance.completed_by,
                        lastCompleted: chore.last_completed,
                        status: status,
                        skipped: instance.skipped,
                        modifiedHistory: instance.modified_history,
                        startDate: instance.start_date,
                        endDate: instance.end_date
                    }
                };
            });
        }

        // Handle non-instance chores (legacy support)
        const status = chore.is_complete ? 'completed' : 'active';
        return [{
            ...baseEventProps,
            start: chore.start_date + (chore.due_time ? `T${chore.due_time}` : ''),
            end: chore.end_date + (chore.due_time ? `T${chore.due_time}` : ''),
            backgroundColor: STATUS_COLORS[status].bg,
            borderColor: STATUS_COLORS[status].border,
            extendedProps: {
                ...baseEventProps.extendedProps,
                isComplete: chore.is_complete,
                lastCompleted: chore.last_completed,
                status: status
            }
        }];
    });
    
    memoCache.set(cacheKey, events);
    return events;
};

// Clear memoization cache when needed (e.g., on significant state changes)
export const clearCalendarCache = () => {
    memoCache.clear();
};
