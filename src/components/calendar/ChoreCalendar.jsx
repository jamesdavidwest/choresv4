import { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { transformChoresToEvents } from '../../utils/calendarUtils';
import { useChores } from '../../context/ChoresContext';
import ChoreModal from './ChoreModal';

const ChoreCalendar = ({ chores }) => {
  const { toggleChoreComplete, createChore, refreshPersonalChores, refreshAllChores, canManageChores } = useChores();
  const [selectedChore, setSelectedChore] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [events, setEvents] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState(null);

  // Update events when chores change
  useEffect(() => {
    const newEvents = transformChoresToEvents(chores);
    setEvents(newEvents);
    console.log('Calendar events updated:', newEvents);
  }, [chores]);

  const handleEventClick = useCallback((clickInfo) => {
    const { choreId, instanceId } = clickInfo.event.extendedProps;
    const chore = chores.find(c => c.id === choreId);
    
    if (chore) {
      setSelectedChore(chore);
      setSelectedDate(clickInfo.event.start.toISOString());
      const instance = instanceId ? 
        chore.instances?.find(i => i.id === instanceId) : 
        null;
      setSelectedInstance(instance);
      setModalMode('view');
      setIsModalOpen(true);
    }
  }, [chores]);

  const handleToggleComplete = useCallback(async (choreId, instanceId) => {
    try {
      await toggleChoreComplete(choreId, instanceId);
      
      // Refresh both personal and all chores as needed
      await refreshPersonalChores();
      if (canManageChores) {
        await refreshAllChores();
      }
      
      setIsModalOpen(false);
      setSelectedChore(null);
      setSelectedInstance(null);
      setModalMode('view');

    } catch (error) {
      console.error('Toggle error:', error);
      throw error;
    }
  }, [toggleChoreComplete, refreshPersonalChores, refreshAllChores, canManageChores]);

  const handleCreateChore = useCallback(async (choreData) => {
    try {
      await createChore({
        ...choreData,
        due_date: selectedDate
      });
      
      // Refresh chores after creation
      await refreshPersonalChores();
      if (canManageChores) {
        await refreshAllChores();
      }
      
      setIsModalOpen(false);
      setSelectedDate(null);
      setModalMode('view');

    } catch (error) {
      console.error('Create error:', error);
      throw error;
    }
  }, [createChore, selectedDate, refreshPersonalChores, refreshAllChores, canManageChores]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedChore(null);
    setSelectedDate(null);
    setSelectedInstance(null);
    setModalMode('view');
  }, []);

  const handleDateSelect = useCallback((selectInfo) => {
    if (canManageChores) {
      setSelectedDate(selectInfo.startStr);
      setModalMode('create');
      setIsModalOpen(true);
    }
  }, [canManageChores]);

  const handleCreateClick = useCallback(() => {
    setSelectedDate(new Date().toISOString());
    setModalMode('create');
    setIsModalOpen(true);
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
        {canManageChores && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleCreateClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Create New Chore
            </button>
          </div>
        )}
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
              selectable={canManageChores}
              select={handleDateSelect}
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
        onSave={handleCreateChore}
        currentDate={selectedDate}
        mode={modalMode}
        selectedInstance={selectedInstance}
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
    notes: PropTypes.string,
    instances: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number,
      chore_id: PropTypes.number,
      due_date: PropTypes.string,
      is_complete: PropTypes.bool,
      completed_at: PropTypes.string,
      completed_by: PropTypes.number
    }))
  })).isRequired
};

export default ChoreCalendar;
