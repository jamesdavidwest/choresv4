import React, { useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { transformChoreToEvent } from '../../utils/calendarUtils';

const ChoreCalendar = ({ chores }) => {
  useEffect(() => {
    console.log('Raw chores data:', chores);
  }, [chores]);

  const events = chores?.map(transformChoreToEvent) || [];
  console.log('Transformed events:', events);

  return (
    <div className="bg-background">
      <div className="p-4">
        <div className="card bg-card">
          <div className="card-body">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={events}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              contentHeight="auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChoreCalendar;