// src/hooks/useTasks.js
import { useState, useCallback, useEffect, useMemo } from 'react';
import { tasks, calendar } from '../services/api';
import { transformTasksToEvents, determineInstanceStatus } from '../utils/calendarUtils';
import { STATUS_COLORS } from '../constants/taskConstants';
import { isValid, parseISO, differenceInDays } from 'date-fns';

const INSTANCE_BATCH_SIZE = 50;
const PREFETCH_THRESHOLD = 7;

export const useTasks = () => {
    const [loading, setLoading] = useState(false);
    const [instanceLoading, setInstanceLoading] = useState(false);
    const [error, setError] = useState(null);
    const [events, setEvents] = useState([]);
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [prefetchedRange, setPrefetchedRange] = useState({ start: null, end: null });

    // Cleanup function
    useEffect(() => {
        return () => {
            setEvents([]);
            setError(null);
            setLoading(false);
            setInstanceLoading(false);
            setPrefetchedRange({ start: null, end: null });
        };
    }, []);

    // Validate date range
    const validateDateRange = useCallback((startStr, endStr) => {
        if (!startStr || !endStr) {
            throw new Error('Start and end dates are required');
        }

        const start = parseISO(startStr);
        const end = parseISO(endStr);

        if (!isValid(start) || !isValid(end)) {
            throw new Error('Invalid date format');
        }

        if (end < start) {
            throw new Error('End date must be after start date');
        }

        return { start, end };
    }, []);

    // Check if we need to prefetch more instances
    const shouldPrefetch = useCallback((currentEnd, prefetchedEnd) => {
        if (!prefetchedEnd) return true;
        const daysUntilEnd = differenceInDays(parseISO(prefetchedEnd), parseISO(currentEnd));
        return daysUntilEnd <= PREFETCH_THRESHOLD;
    }, []);

    // Process instances in batches
    const processInstanceBatch = useCallback(async (instances, existingEvents) => {
        const batchedEvents = [];
        
        for (let i = 0; i < instances.length; i += INSTANCE_BATCH_SIZE) {
            const batch = instances.slice(i, i + INSTANCE_BATCH_SIZE);
            const batchEvents = batch.map(instance => {
                const existingEvent = existingEvents.find(e => 
                    e.extendedProps?.instanceId === instance.id
                );
                
                if (existingEvent) {
                    return existingEvent;
                }
                
                const status = determineInstanceStatus(instance);
                return {
                    ...instance,
                    backgroundColor: STATUS_COLORS[status].bg,
                    borderColor: STATUS_COLORS[status].border,
                    extendedProps: {
                        ...instance,
                        status
                    }
                };
            });
            
            batchedEvents.push(...batchEvents);
            
            // Allow UI to update between batches
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        return batchedEvents;
    }, []);

    // Update instance status
    const updateInstanceStatus = useCallback(async (taskId, instanceId) => {
        try {
            setInstanceLoading(true);
            setError(null);

            const result = await tasks.toggleComplete(taskId, instanceId);
            
            setEvents(prevEvents => {
                return prevEvents.map(event => {
                    if (event.extendedProps?.instanceId === instanceId) {
                        const status = determineInstanceStatus({
                            ...event,
                            is_complete: result.is_complete,
                            completed_at: result.completed_at,
                            completed_by: result.completed_by
                        });

                        return {
                            ...event,
                            backgroundColor: STATUS_COLORS[status].bg,
                            borderColor: STATUS_COLORS[status].border,
                            extendedProps: {
                                ...event.extendedProps,
                                is_complete: result.is_complete,
                                completed_at: result.completed_at,
                                completed_by: result.completed_by,
                                status
                            }
                        };
                    }
                    return event;
                });
            });

            return result;
        } catch (err) {
            setError(err.message || 'Failed to update instance status');
            console.error('Error updating instance status:', err);
            throw err;
        } finally {
            setInstanceLoading(false);
        }
    }, []);

    const refetchEvents = useCallback(async (startStr, endStr, userId) => {
        setError(null);
        
        try {
            const { start, end } = validateDateRange(startStr, endStr);
            setDateRange({ start, end });

            if (prefetchedRange.start && prefetchedRange.end) {
                const prefetchStart = parseISO(prefetchedRange.start);
                const prefetchEnd = parseISO(prefetchedRange.end);
                
                if (start >= prefetchStart && end <= prefetchEnd) {
                    return; // Data already available
                }
            }

            setLoading(true);

            // Use the calendar API to get instances for the date range
            const instances = await calendar.getInstances({
                startDate: startStr,
                endDate: endStr,
                userId: userId
            });
            
            // Transform instances to calendar events
            const transformedEvents = transformTasksToEvents(instances);
            
            // Process instances in batches
            const processedEvents = await processInstanceBatch(
                transformedEvents,
                events
            );
            
            setEvents(processedEvents);
            setPrefetchedRange({ start: startStr, end: endStr });

            // Check if we need to prefetch more data
            if (shouldPrefetch(endStr, prefetchedRange.end)) {
                const prefetchEnd = new Date(parseISO(endStr).getTime() + 30 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0];

                calendar.getInstances({
                    startDate: endStr,
                    endDate: prefetchEnd,
                    userId: userId
                }).then(prefetchData => {
                    const prefetchedEvents = transformTasksToEvents(prefetchData);
                    setEvents(prev => [...prev, ...prefetchedEvents]);
                }).catch(console.error);
            }
        } catch (err) {
            const errorMessage = err.message || 'Failed to fetch tasks';
            console.error('Error fetching tasks:', err);
            setError(errorMessage);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [validateDateRange, processInstanceBatch, events, prefetchedRange, shouldPrefetch]);

    // Get instance status
    const getInstanceStatus = useCallback((instanceId) => {
        const event = events.find(e => e.extendedProps?.instanceId === instanceId);
        if (!event) return 'pending';
        
        return event.extendedProps?.status || determineInstanceStatus({
            is_complete: event.extendedProps?.is_complete,
            completed_at: event.extendedProps?.completed_at,
            due_date: event.start
        });
    }, [events]);

    // Memoized date range
    const currentDateRange = useMemo(() => dateRange, [dateRange]);

    return {
        loading,
        instanceLoading,
        error,
        events,
        dateRange: currentDateRange,
        refetchEvents,
        updateInstanceStatus,
        getInstanceStatus
    };
};