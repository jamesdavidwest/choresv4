import React, { useState, useEffect } from 'react';
import ChoreCalendar from '../../components/calendar/ChoreCalendar';
import { choreToEvent } from '../../components/calendar/calendarUtils';

const CalendarPage = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // TODO: Fetch chores from your API
    // For now, we'll use empty events array
    setEvents([]);
  }, []);

  const handleEventClick = (clickInfo) => {
    console.log('Event clicked:', clickInfo.event);
    // TODO: Implement event click handling
  };

  const handleEventDrop = (dropInfo) => {
    console.log('Event dropped:', dropInfo.event);
    // TODO: Implement event rescheduling
  };

  const handleDateSelect = (selectInfo) => {
    console.log('Date selected:', selectInfo);
    // TODO: Implement new event creation
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-dark-50 mb-6">
        Chore Calendar
      </h1>
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md">
        <ChoreCalendar
          events={events}
          onEventClick={handleEventClick}
          onEventDrop={handleEventDrop}
          onDateSelect={handleDateSelect}
        />
      </div>
    </div>
  );
};

export default CalendarPage;