import { useState, useCallback } from 'react';
import { chores } from '../services/api';
import { transformChoresToEvents } from '../utils/calendarUtils';

export const useChores = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [events, setEvents] = useState([]);

    const refetchEvents = useCallback(async (startStr, endStr, userId) => {
        if (!startStr || !endStr) {
            console.error('Missing date range:', { startStr, endStr });
            return;
        }

        console.log('Fetching chores with params:', { startStr, endStr, userId });
        
        try {
            setLoading(true);
            const data = await chores.getAll({
                startDate: startStr,
                endDate: endStr,
                userId: userId
            });
            
            console.log('Received chores data:', data);
            const transformedEvents = transformChoresToEvents(data);
            console.log('Transformed events:', transformedEvents);
            
            setEvents(transformedEvents);
        } catch (err) {
            console.error('Error fetching chores:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, error, events, refetchEvents };
};