import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { transformChoresToEvents } from '../../utils/calendarUtils';
import { useChores } from '../../context/ChoresContext';
import ChoreModal from './ChoreModal';

const ChoreCalendar = ({ chores }) => {
  const { toggleChoreComplete, refreshPersonalChores, refreshAllChores, canManageChores } = useChores();
  const [selectedChore, setSelectedChore] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState([]);

  // Update events when chores change
  useEffect(() => {
    const newEvents = transformChoresToEvents(chores, new Date(), null);
    setEvents(newEvents);
    console.log('Calendar events updated:', newEvents);
  }, [chores]);

  const handleEventClick = useCallback((clickInfo) => {
    const { choreId } = clickInfo.event.extendedProps;
    const chore = chores.find(c => c.id === choreId);
    
    if (chore) {
      setSelectedChore(chore);
      setSelectedDate(clickInfo.event.start.toISOString());
      setIsModalOpen(true);
    }
  }, [chores]);

  const handleToggleComplete = useCallback(async (choreId) => {
    try {
      await toggleChoreComplete(choreId);
      
      // Refresh both personal and all chores as needed
      await refreshPersonalChores();
      if (canManageChores) {
        await refreshAllChores();
      }
      
      setIsModalOpen(false);
      setSelectedChore(null);

    } catch (error) {
      console.error('Toggle error:', error);
      // Here you might want to show an error toast
      throw error;
    }
  }, [toggleChoreComplete, refreshPersonalChores, refreshAllChores, canManageChores]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedChore(null);
    setSelectedDate(null);
  }, []);

  const handleDatesSet = useCallback((dateInfo) => {
    console.log('Calendar date range:', {
      start: dateInfo.start,
      end: dateInfo.end
    });
  }, []);

  return (
    <div className="bg-background">
      <div className="p-4">
        <div className="card bg-card shadow-lg rounded-lg overflow-hidden">
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
              editable={false}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              contentHeight="auto"
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              eventContent={(eventInfo) => ({
                html: `<div class="p-1">
                  <div class="font-semibold">${eventInfo.event.title}</div>
                  <div class="flex items-center mt-1">
                    ${eventInfo.event.extendedProps.isComplete ? 
                      '<span class="text-blue-800 text-sm">✓</span><span class="text-xs ml-1">Complete</span>' : 
                      '<span class="text-red-600 text-sm">❌</span><span class="text-xs ml-1">Pending</span>'}
                  </div>
                </div>`
              })}
            />
          </div>
        </div>
      </div>

      <ChoreModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        chore={selectedChore}
        onToggleComplete={handleToggleComplete}
        currentDate={selectedDate}
      />
    </div>
  );
};

ChoreCalendar.propTypes = {
  chores: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    frequency_id: PropTypes.number,
    location_id: PropTypes.number,
    assigned_to: PropTypes.number,
    is_complete: PropTypes.bool,
    notes: PropTypes.string
  })).isRequired
};

export default ChoreCalendar;