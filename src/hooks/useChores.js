import { useState, useCallback, useEffect, useMemo } from 'react';
import { chores } from '../services/api';
import { transformChoresToEvents, determineInstanceStatus } from '../utils/calendarUtils';
import { STATUS_COLORS } from '../constants/choreConstants';
import { isValid, parseISO, differenceInDays } from 'date-fns';

const INSTANCE_BATCH_SIZE = 50; // Number of instances to process at once
const PREFETCH_THRESHOLD = 7; // Days before range end to trigger prefetch

export const useChores = () => {
    const [loading, setLoading] = useState(false);
    const [instanceLoading, setInstanceLoading] = useState(false);
    const [error, setError] = useState(null);
    const [events, setEvents] = useState([]);
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [prefetchedRange, setPrefetchedRange] = useState({ start: null, end: null });

    // Cleanup function to reset state when component unmounts
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
    const updateInstanceStatus = useCallback(async (choreId, instanceId) => {
        try {
            setInstanceLoading(true);
            setError(null);

            const result = await chores.toggleComplete(choreId, instanceId);
            
            // Update local state to reflect the change
            setEvents(prevEvents => {
                return prevEvents.map(event => {
                    if (event.extendedProps?.instanceId === instanceId) {
                        const status = determineInstanceStatus({
                            ...event,
                            is_complete: result.is_complete,
                            skipped: result.skipped
                        });

                        return {
                            ...event,
                            backgroundColor: STATUS_COLORS[status].bg,
                            borderColor: STATUS_COLORS[status].border,
                            extendedProps: {
                                ...event.extendedProps,
                                isComplete: result.is_complete,
                                completedAt: result.completed_at,
                                completedBy: result.completed_by,
                                status: status,
                                skipped: result.skipped
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
            // Validate date range
            const { start, end } = validateDateRange(startStr, endStr);
            setDateRange({ start, end });

            // Check if we need to fetch new data
            if (prefetchedRange.start && prefetchedRange.end) {
                const prefetchStart = parseISO(prefetchedRange.start);
                const prefetchEnd = parseISO(prefetchedRange.end);
                
                if (start >= prefetchStart && end <= prefetchEnd) {
                    // Data already available
                    return;
                }
            }

            setLoading(true);
            const data = await chores.getAll({
                startDate: startStr,
                endDate: endStr,
                userId: userId
            });
            
            // Transform events using the utility function
            const transformedEvents = transformChoresToEvents(data);
            
            // Process instances in batches
            const processedEvents = await processInstanceBatch(
                transformedEvents,
                events
            );
            
            setEvents(processedEvents);
            setPrefetchedRange({ start: startStr, end: endStr });

            // Check if we need to prefetch more data
            if (shouldPrefetch(endStr, prefetchedRange.end)) {
                // Trigger background prefetch
                chores.getAll({
                    startDate: endStr,
                    endDate: new Date(parseISO(endStr).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    userId: userId
                }).then(prefetchData => {
                    const prefetchedEvents = transformChoresToEvents(prefetchData);
                    setEvents(prev => [...prev, ...prefetchedEvents]);
                }).catch(console.error);
            }
        } catch (err) {
            const errorMessage = err.message || 'Failed to fetch chores';
            console.error('Error fetching chores:', err);
            setError(errorMessage);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [validateDateRange, processInstanceBatch, events, prefetchedRange, shouldPrefetch]);

    // Memoized event getters
    const getInstanceStatus = useCallback((instanceId) => {
        const event = events.find(e => e.extendedProps?.instanceId === instanceId);
        if (!event) return 'pending';
        
        return event.extendedProps?.status || determineInstanceStatus({
            is_complete: event.extendedProps?.isComplete,
            skipped: event.extendedProps?.skipped,
            due_date: event.start
        });
    }, [events]);

    // Skip instance
    const skipInstance = useCallback(async (choreId, instanceId) => {
        try {
            setInstanceLoading(true);
            setError(null);

            const result = await chores.skipInstance(choreId, instanceId);
            
            // Update local state
            setEvents(prevEvents => {
                return prevEvents.map(event => {
                    if (event.extendedProps?.instanceId === instanceId) {
                        return {
                            ...event,
                            backgroundColor: STATUS_COLORS.skipped.bg,
                            borderColor: STATUS_COLORS.skipped.border,
                            extendedProps: {
                                ...event.extendedProps,
                                status: 'skipped',
                                skipped: true
                            }
                        };
                    }
                    return event;
                });
            });

            return result;
        } catch (err) {
            setError(err.message || 'Failed to skip instance');
            console.error('Error skipping instance:', err);
            throw err;
        } finally {
            setInstanceLoading(false);
        }
    }, []);

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
        getInstanceStatus,
        skipInstance
    };
};
