import { useState, useCallback, useMemo } from 'react';
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
import { addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const USERS = {
    1: { name: 'David', role: 'ADMIN' },
    2: { name: 'Angela', role: 'MANAGER' },
    3: { name: 'Dodie', role: 'MANAGER' },
    4: { name: 'Sadie', role: 'USER' },
    5: { name: 'Sami', role: 'USER' }
};

const USER_OPTIONS = [
    { id: 0, name: 'All' },
    ...Object.entries(USERS).map(([id, userData]) => ({
        id: parseInt(id),
        name: userData.name
    }))
];

const ChoreCalendar = () => {
    const { user } = useAuth();
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedInstance, setSelectedInstance] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('view');
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(user?.id);
    const [completionFilterState, setCompletionFilterState] = useState('all');

    // Calculate extended date range for better instance handling
    const getExtendedDateRange = useCallback((start, end) => {
        const extendedStart = subMonths(startOfMonth(new Date(start)), 1).toISOString().split('T')[0];
        const extendedEnd = addMonths(endOfMonth(new Date(end)), 1).toISOString().split('T')[0];
        return { start: extendedStart, end: extendedEnd };
    }, []);

    const { loading, instanceLoading, error, events, refetchEvents, updateInstanceStatus } = useChores();

    // Memoized event handlers
    const handleEventClick = useCallback((clickInfo) => {
        const event = transformEventForModal(clickInfo.event);
        setSelectedEvent(event);
        
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
            const { start, end } = getExtendedDateRange(dateInfo.startStr, dateInfo.endStr);
            await refetchEvents(start, end, selectedUserId === 0 ? null : selectedUserId);
        } catch (err) {
            console.error('Error in handleDatesSet:', err);
        }
    }, [refetchEvents, selectedUserId, getExtendedDateRange]);

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
            const currentView = window.calendar?.view;
            if (currentView) {
                const { start, end } = getExtendedDateRange(
                    currentView.currentStart.toISOString(),
                    currentView.currentEnd.toISOString()
                );
                await refetchEvents(start, end, selectedUserId === 0 ? null : selectedUserId);
            }
            
            handleCloseModal();
        } catch (error) {
            console.error('Error deleting chore:', error);
            alert('Failed to delete chore: ' + error.message);
        }
    }, [refetchEvents, handleCloseModal, selectedUserId, getExtendedDateRange]);

    const handleChoreComplete = useCallback(async (choreId, instanceId) => {
        try {
            const result = await updateInstanceStatus(choreId, instanceId);
            return result;
        } catch (error) {
            console.error('Error completing chore:', error);
            throw error;
        }
    }, [updateInstanceStatus]);

    const handleCreateChore = useCallback(async (choreData) => {
        try {
            await chores.create(choreData);
            const currentView = window.calendar?.view;
            if (currentView) {
                const { start, end } = getExtendedDateRange(
                    currentView.currentStart.toISOString(),
                    currentView.currentEnd.toISOString()
                );
                await refetchEvents(start, end, selectedUserId === 0 ? null : selectedUserId);
            }
            
            handleCloseModal();
        } catch (error) {
            console.error('Error creating chore:', error);
            throw error;
        }
    }, [refetchEvents, handleCloseModal, selectedUserId, getExtendedDateRange]);

    const handleUserChange = useCallback(async (newUserId) => {
        setSelectedUserId(newUserId);
        
        try {
            const currentView = window.calendar?.view;
            if (currentView) {
                const { start, end } = getExtendedDateRange(
                    currentView.currentStart.toISOString(),
                    currentView.currentEnd.toISOString()
                );
                await refetchEvents(start, end, newUserId === 0 ? null : newUserId);
            }
        } catch (error) {
            console.error('Error changing user:', error);
        }
    }, [refetchEvents, getExtendedDateRange]);

    // Memoized filtered events
    const filteredEvents = useMemo(() => {
        return events.filter(event => {
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
    }, [events, completionFilterState]);

    // Memoized event content renderer
    const renderEventContent = useCallback((eventInfo) => (
        <div className={`${getEventStyle(eventInfo.event)} w-[150px] max-w-full p-1 !h-fit !min-h-fit flex flex-col !justify-start`}>
            <div className="text-sm font-medium text-white whitespace-nowrap overflow-hidden text-ellipsis">
                {eventInfo.event.title}
            </div>
            <div className="flex justify-between items-center text-xs text-gray-200 w-full mt-0">
                <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {getAssigneeName(eventInfo.event.extendedProps.assignedTo)}
                </span>
                {eventInfo.timeText && <span className="flex-shrink-0 ml-1">{eventInfo.timeText}</span>}
            </div>
        </div>
    ), []);

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
                {(loading || instanceLoading) && (
                    <div className="absolute inset-0 bg-gray-900/50 z-10 flex items-center justify-center">
                        <div className="text-white bg-gray-800 rounded-lg p-4 shadow-lg">
                            {instanceLoading ? 'Updating...' : 'Loading...'}
                        </div>
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
                    eventContent={renderEventContent}
                    ref={calendar => {
                        if (calendar) {
                            window.calendar = calendar.getApi();
                        }
                    }}
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
