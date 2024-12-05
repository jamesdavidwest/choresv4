import { format, parseISO } from 'date-fns';

// Convert backend chore data to FullCalendar event format
export const transformChoreToEvent = (chore) => {
    return {
        id: chore.id,
        title: chore.name,
        start: chore.start,
        end: chore.end,
        allDay: false,
        className: getEventClassNames(chore),
        extendedProps: {
            ...chore.extendedProps,
            frequencyId: chore.frequency_id,
            locationId: chore.location_id,
            assignedTo: chore.assigned_to
        }
    };
};

// Get CSS classes based on chore status
export const getEventClassNames = (chore) => {
    const classes = ['chore-event'];
    
    if (chore.extendedProps?.status) {
        classes.push(`status-${chore.extendedProps.status}`);
    }

    return classes;
};

// Format date for display
export const formatChoreDate = (dateStr) => {
    if (!dateStr) return '';
    return format(parseISO(dateStr), 'PPp'); // e.g., "Apr 29, 2024, 9:00 AM"
};

// Generate recurring events
export const generateRecurringEvents = (chore, startDate, endDate) => {
    const events = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
        // Add event based on frequency
        events.push({
            ...chore,
            start: currentDate.toISOString(),
            end: new Date(currentDate.getTime() + 3600000).toISOString() // 1 hour duration
        });

        // Increment date based on frequency
        switch (chore.frequency_id) {
            case 1: // daily
                currentDate.setDate(currentDate.getDate() + 1);
                break;
            case 2: // weekly
                currentDate.setDate(currentDate.getDate() + 7);
                break;
            case 3: // monthly
                currentDate.setMonth(currentDate.getMonth() + 1);
                break;
            case 4: // quarterly
                currentDate.setMonth(currentDate.getMonth() + 3);
                break;
            case 5: // yearly
                currentDate.setFullYear(currentDate.getFullYear() + 1);
                break;
            default:
                break;
        }
    }

    return events;
};

// Get event color based on status
export const getEventColor = (status) => {
    switch (status) {
        case 'completed':
            return '#4CAF50';  // Green
        case 'overdue':
            return '#F44336';  // Red
        case 'pending':
            return '#FFC107';  // Amber
        case 'upcoming':
            return '#2196F3';  // Blue
        default:
            return '#9E9E9E';  // Grey
    }
};

// Create the event content for FullCalendar
export const renderEventContent = (eventInfo) => {
    const { timeText, event } = eventInfo;
    const { extendedProps } = event;
    
    return {
        html: `
            <div class="fc-content">
                <div class="fc-time">${timeText}</div>
                <div class="fc-title">${event.title}</div>
                ${extendedProps.location ? `<div class="fc-location">${extendedProps.location}</div>` : ''}
                ${extendedProps.assignedTo ? `<div class="fc-assigned">${extendedProps.assignedTo}</div>` : ''}
            </div>
        `
    };
};