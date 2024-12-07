import { useEffect, useCallback, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { transformChoresToEvents } from '../../utils/calendarUtils';
import { useChores } from '../../context/ChoresContext';
import ChoreModal from './ChoreModal';

const USERS = {
  1: { name: 'David', role: 'ADMIN' },
  2: { name: 'Angela', role: 'MANAGER' },
  3: { name: 'Dodie', role: 'MANAGER' },
  4: { name: 'Sadie', role: 'USER' },
  5: { name: 'Sami', role: 'USER' }
};

const ChoreCalendar = ({ chores, currentUser }) => {
  const { toggleChoreComplete, createChore, refreshPersonalChores, refreshAllChores, canManageChores } = useChores();
  const [selectedChore, setSelectedChore] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [events, setEvents] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(() => {
    const saved = localStorage.getItem('selectedUserId');
    return saved ? parseInt(saved, 10) : currentUser?.id || 1;
  });

  // Update selectedUserId when currentUser changes and no saved value exists
  useEffect(() => {
    if (currentUser && !localStorage.getItem('selectedUserId')) {
      setSelectedUserId(currentUser.id);
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedUserId) {
      localStorage.setItem('selectedUserId', selectedUserId);
    }
  }, [selectedUserId]);

  const filteredChores = useMemo(() => {
    return chores.filter(chore => {
      // Only show chores for selected user (for admin/manager)
      // or current user's chores (for regular users)
      if (['ADMIN', 'MANAGER'].includes(currentUser?.role)) {
        return chore.assigned_to === selectedUserId;
      }
      return chore.assigned_to === currentUser?.id;
    });
  }, [chores, selectedUserId, currentUser]);

  // Update events when chores change
  useEffect(() => {
    const newEvents = transformChoresToEvents(filteredChores);
    setEvents(newEvents);
    console.log('Calendar events updated:', newEvents);
  }, [filteredChores]);

  const handleEventClick = useCallback((clickInfo) => {
    const { choreId, instanceId } = clickInfo.event.extendedProps;
    const chore = filteredChores.find(c => c.id === choreId);
    
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
  }, [filteredChores]);

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
        <div className="mb-4 flex justify-between items-center">
          {['ADMIN', 'MANAGER'].includes(currentUser?.role) && (
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(parseInt(e.target.value, 10))}
                className="appearance-none bg-blue-900/60 text-blue-300 px-4 py-2 rounded-md hover:bg-blue-900/80 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
              >
                {Object.entries(USERS).map(([id, user]) => (
                  <option key={id} value={id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-300">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                </svg>
              </div>
            </div>
          )}
          {canManageChores && (
            <button
              onClick={handleCreateClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Create New Chore
            </button>
          )}
        </div>
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
        selectedUserId={selectedUserId}
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
  })).isRequired,
  currentUser: PropTypes.shape({
    id: PropTypes.number.isRequired,
    role: PropTypes.string.isRequired
  }).isRequired
};

export default ChoreCalendar;
