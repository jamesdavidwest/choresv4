import { useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getEventStyle, transformEventForModal, getAssigneeName } from '../../utils/calendarUtils';
import ChoreModal from './ChoreModal';
import { useChores } from '../../hooks/useChores';
import { useAuth } from '../../context/AuthContext';
import { chores } from '../../services/api';
import { Dropdown } from '../../components/ui/dropdown';

const USERS = {
    1: { name: 'David', role: 'ADMIN' },
    2: { name: 'Angela', role: 'MANAGER' },
    3: { name: 'Dodie', role: 'MANAGER' },
    4: { name: 'Sadie', role: 'USER' },
    5: { name: 'Sami', role: 'USER' }
};

// Transform USERS object into array format for Dropdown
const USER_OPTIONS = [
    { id: 0, name: 'All' },  // Changed from empty string to 0
    ...Object.entries(USERS).map(([id, userData]) => ({
        id: parseInt(id),
        name: userData.name
    }))
];

// Helper function to get current month's date range
const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
    };
};

const ChoreCalendar = () => {
    const { user } = useAuth();
    const { loading, error, events, refetchEvents } = useChores();
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedInstance, setSelectedInstance] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('view');
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(user?.id);
    const [currentViewDates, setCurrentViewDates] = useState(getCurrentMonthRange());
    const [completionFilterState, setCompletionFilterState] = useState('all');

    const handleEventClick = useCallback((clickInfo) => {
        const event = transformEventForModal(clickInfo.event);
        setSelectedEvent(event);
        
        // If this is an instance-specific event, create the instance object
        if (event.instanceId) {
            setSelectedInstance({
                id: event.instanceId,
                chore_id: event.id,
                due_date: clickInfo.event.start.toISOString().split('T')[0],
                is_complete: event.is_complete,
                completed_at: event.completed_at,
                completed_by: event.completed_by
            });
        } else {
            setSelectedInstance(null);
        }
        
        setModalMode('view');
        setIsModalOpen(true);
    }, []);

    const handleDateClick = useCallback((dateInfo) => {
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) return;
        
        setSelectedDate(dateInfo.dateStr);
        setModalMode('create');
        setIsModalOpen(true);
    }, [user]);

    const handleCreateClick = useCallback(() => {
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setModalMode('create');
        setIsModalOpen(true);
    }, []);

    const handleDatesSet = useCallback(async (dateInfo) => {
        try {
            const startStr = dateInfo.startStr.split('T')[0];
            const endStr = dateInfo.endStr.split('T')[0];
            
            setCurrentViewDates({
                start: startStr,
                end: endStr
            });
            await refetchEvents(startStr, endStr, selectedUserId === 0 ? null : selectedUserId);
        } catch (err) {
            console.error('Error in handleDatesSet:', err);
            // On error, fall back to current month
            const currentRange = getCurrentMonthRange();
            setCurrentViewDates(currentRange);
            await refetchEvents(currentRange.start, currentRange.end, selectedUserId === 0 ? null : selectedUserId);
        }
    }, [refetchEvents, selectedUserId]);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedEvent(null);
        setSelectedInstance(null);
        setSelectedDate(null);
    }, []);

    const handleDeleteChore = useCallback(async (choreId) => {
        try {
            if (!window.confirm('Are you sure you want to delete this chore? This cannot be undone.')) {
                return;
            }

            await chores.delete(choreId);
            
            // Refresh events
            await refetchEvents(
                currentViewDates.start,
                currentViewDates.end,
                selectedUserId === 0 ? null : selectedUserId
            );
            
            handleCloseModal();
        } catch (error) {
            console.error('Error deleting chore:', error);
            alert('Failed to delete chore: ' + error.message);
        }
    }, [refetchEvents, handleCloseModal, currentViewDates, selectedUserId]);

    const handleChoreComplete = useCallback(async (choreId, instanceId) => {
        try {
            // First toggle the completion status
            const result = await chores.toggleComplete(choreId, instanceId);
            
            // Create a promise that resolves when state updates are complete
            await new Promise(resolve => {
                // Update the selected event with the new status
                if (instanceId) {
                    setSelectedInstance(prev => ({
                        ...prev,
                        is_complete: result.is_complete,
                        completed_at: result.completed_at,
                        completed_by: result.completed_by
                    }));
                } else {
                    setSelectedEvent(prev => ({
                        ...prev,
                        is_complete: result.is_complete,
                        last_completed: result.last_completed
                    }));
                }
                
                // Use setTimeout to ensure state updates have been processed
                setTimeout(resolve, 0);
            });
            
            // Then refresh the events
            await refetchEvents(
                currentViewDates.start,
                currentViewDates.end,
                selectedUserId === 0 ? null : selectedUserId
            );
            
            return result;
        } catch (error) {
            console.error('Error completing chore:', error);
            throw error;
        }
    }, [refetchEvents, selectedUserId, currentViewDates]);

    const handleCreateChore = useCallback(async (choreData) => {
        try {
            await chores.create(choreData);
            
            // After creating a chore, fetch all chores regardless of user filter
            await refetchEvents(
                currentViewDates.start,
                currentViewDates.end,
                selectedUserId === 0 ? null : selectedUserId
            );
            
            handleCloseModal();
        } catch (error) {
            console.error('Error creating chore:', error);
            throw error;
        }
    }, [refetchEvents, handleCloseModal, currentViewDates, selectedUserId]);

    const handleUserChange = useCallback(async (newUserId) => {
        setSelectedUserId(newUserId);
        
        try {
            await refetchEvents(
                currentViewDates.start,
                currentViewDates.end,
                newUserId === 0 ? null : newUserId
            );
        } catch (error) {
            console.error('Error changing user:', error);
        }
    }, [refetchEvents, currentViewDates]);

    // Filter events based on completion status
    const filteredEvents = events.filter(event => {
        const isComplete = event.extendedProps?.isComplete || event.extendedProps?.is_complete;
        switch (completionFilterState) {
            case 'completed':
                return isComplete;
            case 'pending':
                return !isComplete;
            default:
                return true;
        }
    });

    if (error) return <div className="text-red-500">Error: {error.message}</div>;

    const canSelectUser = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    return (
        <div className="h-full flex flex-col">
            <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    {canSelectUser && (
                        <Dropdown
                            options={USER_OPTIONS}
                            selectedValue={selectedUserId || 0}
                            onSelect={handleUserChange}
                            placeholder="All Users"
                            className="w-48"
                        />
                    )}
                </div>
                <div className="flex space-x-1">
                    <button
                        onClick={() => setCompletionFilterState('all')}
                        className={`px-4 py-2 rounded-md focus:outline-none ${
                            completionFilterState === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setCompletionFilterState('completed')}
                        className={`px-4 py-2 rounded-md focus:outline-none ${
                            completionFilterState === 'completed'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        Completed
                    </button>
                    <button
                        onClick={() => setCompletionFilterState('pending')}
                        className={`px-4 py-2 rounded-md focus:outline-none ${
                            completionFilterState === 'pending'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        Pending
                    </button>
                </div>
                {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                    <button
                        onClick={handleCreateClick}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Create New Chore
                    </button>
                )}
            </div>
            <div className="flex-grow relative">
                {loading && (
                    <div className="absolute inset-0 bg-gray-900/50 z-10 flex items-center justify-center">
                        <div className="text-white">Loading...</div>
                    </div>
                )}
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={filteredEvents}
                    eventClick={handleEventClick}
                    dateClick={handleDateClick}
                    datesSet={handleDatesSet}
                    height="100%"
                    eventContent={(eventInfo) => (
                        <div className={getEventStyle(eventInfo.event)}>
                            <div className="text-sm font-medium text-white">{eventInfo.event.title}</div>
                            {eventInfo.timeText && (
                                <div className="text-xs text-white">
                                    {eventInfo.timeText}
                                </div>
                            )}
                            <div className="text-xs text-gray-200 mt-1">
                                {getAssigneeName(eventInfo.event.extendedProps.assignedTo)}
                            </div>
                        </div>
                    )}
                />
                
                <ChoreModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    chore={selectedEvent}
                    onToggleComplete={handleChoreComplete}
                    onSave={handleCreateChore}
                    currentDate={selectedDate}
                    mode={modalMode}
                    selectedInstance={selectedInstance}
                    selectedUserId={selectedUserId}
                    user={user}
                    onDelete={() => selectedEvent?.id && handleDeleteChore(selectedEvent.id)}
                />
            </div>
        </div>
    );
};

export default ChoreCalendar;