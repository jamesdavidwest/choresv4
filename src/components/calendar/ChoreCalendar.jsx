import React, { useState, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { 
    transformChoreToEvent, 
    renderEventContent, 
    getEventColor 
} from '../../utils/calendarUtils';

const ChoreCalendar = () => {
    console.log('ChoreCalendar component rendering');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('Component mounted, loading state:', loading);
        return () => console.log('Component unmounting');
    }, [loading]);

    const fetchEvents = useCallback(async (info) => {
        console.log('fetchEvents called with:', info);
        try {
            const { startStr, endStr } = info;
            console.log('Fetching events from API for date range:', { startStr, endStr });
            
            const response = await axios.get('http://localhost:3001/api/calendar/events', {
                params: {
                    start: startStr,
                    end: endStr
                }
            });
            
            console.log('API Response:', response.data);
            
            const transformedEvents = response.data.map(transformChoreToEvent);
            console.log('Transformed events:', transformedEvents);
            
            setEvents(transformedEvents);
            setError(null);
        } catch (err) {
            console.error('Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            setError('Failed to load chores. Please try again later.');
        } finally {
            console.log('Setting loading to false');
            setLoading(false);
        }
    }, []);

    const handleEventClick = async (clickInfo) => {
        console.log('Event clicked:', {
            id: clickInfo.event.id,
            title: clickInfo.event.title,
            extendedProps: clickInfo.event.extendedProps
        });
    };

    const handleEventDrop = async (dropInfo) => {
        console.log('Event drop started:', dropInfo.event.id);
        const { event } = dropInfo;
        try {
            const updateData = {
                date: event.startStr.split('T')[0],
                time: event.startStr.split('T')[1].slice(0, 8)
            };
            console.log('Sending update to API:', updateData);

            await axios.patch(`http://localhost:3001/api/calendar/reschedule/${event.id}`, updateData);
            console.log('Event successfully rescheduled');
        } catch (err) {
            console.error('Event rescheduling failed:', err);
            dropInfo.revert();
        }
    };

    console.log('Current state:', { events, loading, error });

    return (
        <div className="h-full w-full p-4">
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                    <p>{error}</p>
                </div>
            )}
            
            {loading && (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            )}
            
            {!loading && (
                <div className="bg-slate-800 rounded-lg shadow overflow-hidden">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay'
                        }}
                        events={events}
                        eventContent={(info) => {
                            console.log('Rendering event:', info.event);
                            return (
                                <div className={`fc-event-main-frame ${info.event.extendedProps?.status}`}>
                                    <div className="fc-event-time">{info.timeText}</div>
                                    <div className="fc-event-title">{info.event.title}</div>
                                    {info.event.extendedProps?.location && (
                                        <div className="fc-event-location text-xs opacity-75">
                                            {info.event.extendedProps.location}
                                        </div>
                                    )}
                                </div>
                            );
                        }}
                        eventClick={handleEventClick}
                        eventDrop={handleEventDrop}
                        editable={true}
                        selectable={true}
                        selectMirror={true}
                        dayMaxEvents={true}
                        weekends={true}
                        height="auto"
                        datesSet={fetchEvents}
                        eventBackgroundColor={event => getEventColor(event.extendedProps?.status)}
                        eventBorderColor={event => getEventColor(event.extendedProps?.status)}
                    />
                </div>
            )}
        </div>
    );
};

export default ChoreCalendar;