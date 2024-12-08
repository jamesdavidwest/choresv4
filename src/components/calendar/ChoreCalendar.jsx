import { useState, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getEventStyle, transformEventForModal } from '../../utils/calendarUtils';
import ChoreModal from './ChoreModal';
import { useChores } from '../../hooks/useChores';
import { useAuth } from '../../context/AuthContext';
import { chores } from '../../services/api';

const USERS = {
    1: { name: 'David', role: 'ADMIN' },
    2: { name: 'Angela', role: 'MANAGER' },
    3: { name: 'Dodie', role: 'MANAGER' },
    4: { name: 'Sadie', role: 'USER' },
    5: { name: 'Sami', role: 'USER' }
};

const ChoreCalendar = () => {
    const { user } = useAuth();
    const { loading, error, events, refetchEvents } = useChores();
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('view');
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(user?.id);
    const datesUpdateTimeout = useRef(null);
    const calendarRef = useRef(null);

    const handleEventClick = useCallback((clickInfo) => {
        const event = transformEventForModal(clickInfo.event);
        setSelectedEvent(event);
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
        if (!dateInfo.startStr || !dateInfo.endStr || loading) return;
        
        if (datesUpdateTimeout.current) {
            clearTimeout(datesUpdateTimeout.current);
        }

        datesUpdateTimeout.current = setTimeout(async () => {
            const startStr = dateInfo.startStr.split('T')[0];
            const endStr = dateInfo.endStr.split('T')[0];
            await refetchEvents(startStr, endStr, selectedUserId);
        }, 100);
    }, [refetchEvents, loading, selectedUserId]);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedEvent(null);
        setSelectedDate(null);
    }, []);

    const handleChoreComplete = useCallback(async (choreId, instanceId) => {
        try {
            await chores.toggleComplete(choreId, instanceId);
            const calendarApi = calendarRef.current.getApi();
            const { activeStart, activeEnd } = calendarApi.view;
            await refetchEvents(
                activeStart.toISOString().split('T')[0],
                activeEnd.toISOString().split('T')[0],
                selectedUserId
            );
            handleCloseModal();
        } catch (error) {
            console.error('Error completing chore:', error);
            throw error;
        }
    }, [refetchEvents, handleCloseModal, selectedUserId]);

    const handleCreateChore = useCallback(async (choreData) => {
        try {
            await chores.create({
                ...choreData,
                assigned_to: choreData.assigned_to || selectedUserId
            });
            
            // Close modal first
            handleCloseModal();
            
            // Add a small delay before refreshing
            setTimeout(async () => {
                const calendarApi = calendarRef.current.getApi();
                const { activeStart, activeEnd } = calendarApi.view;
                await refetchEvents(
                    activeStart.toISOString().split('T')[0],
                    activeEnd.toISOString().split('T')[0],
                    selectedUserId
                );
            }, 300); // 300ms delay
    
        } catch (error) {
            console.error('Error creating chore:', error);
            throw error;
        }
    }, [refetchEvents, handleCloseModal, selectedUserId]);

    const handleUserChange = useCallback(async (event) => {
        const newUserId = parseInt(event.target.value);
        setSelectedUserId(newUserId);
        
        // Force a refresh of the calendar with the new user
        const calendarApi = calendarRef.current.getApi();
        const { activeStart, activeEnd } = calendarApi.view;
        await refetchEvents(
            activeStart.toISOString().split('T')[0],
            activeEnd.toISOString().split('T')[0],
            newUserId
        );
    }, [refetchEvents]);

    if (loading) return <div className="flex justify-center items-center h-full">Loading...</div>;
    if (error) return <div className="text-red-500">Error: {error.message}</div>;

    const canSelectUser = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    return (
        <div className="h-full flex flex-col">
            <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    {canSelectUser && (
                        <select
                            id="user-filter"
                            name="user-filter"
                            value={selectedUserId}
                            onChange={handleUserChange}
                            className="block w-48 rounded-md bg-gray-800 border-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            {Object.entries(USERS).map(([id, userData]) => (
                                <option key={id} value={id}>{userData.name}</option>
                            ))}
                        </select>
                    )}
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
            <div className="flex-grow">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={events}
                    eventClick={handleEventClick}
                    dateClick={handleDateClick}
                    datesSet={handleDatesSet}
                    eventContent={(eventInfo) => (
                        <div className={getEventStyle(eventInfo.event)}>
                            <div className="text-sm font-medium">{eventInfo.event.title}</div>
                            <div className="text-xs text-gray-600">
                                {eventInfo.timeText}
                            </div>
                        </div>
                    )}
                    height="100%"
                />
                
                <ChoreModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    chore={selectedEvent}
                    onToggleComplete={handleChoreComplete}
                    onSave={handleCreateChore}
                    currentDate={selectedDate}
                    mode={modalMode}
                    selectedUserId={selectedUserId}
                />
            </div>
        </div>
    );
};

export default ChoreCalendar;