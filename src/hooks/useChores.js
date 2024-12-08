import { useState, useEffect, useCallback, useRef } from 'react';
import { chores } from '../services/api';
import { transformChoresToEvents } from '../utils/calendarUtils';

export const useChores = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [events, setEvents] = useState([]);
    const previousRequest = useRef({ startStr: null, endStr: null, userId: null });

    const refetchEvents = useCallback(async (startStr, endStr, userId) => {
        // Skip if nothing has changed
        if (previousRequest.current.startStr === startStr &&
            previousRequest.current.endStr === endStr &&
            previousRequest.current.userId === userId) {
            return;
        }

        if (!startStr || !endStr) return;
        
        try {
            setLoading(true);
            setError(null);
            
            const data = await chores.getAll({
                startDate: startStr,
                endDate: endStr,
                userId: userId
            });
            
            const transformedEvents = transformChoresToEvents(data);
            setEvents(transformedEvents);

            // Update previous request after successful fetch
            previousRequest.current = { startStr, endStr, userId };
        } catch (err) {
            console.error('Error fetching chores:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const currentDate = new Date();
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        refetchEvents(
            start.toISOString().split('T')[0],
            end.toISOString().split('T')[0]
        );
    }, [refetchEvents]);

    return { loading, error, events, refetchEvents };
};