// src/hooks/useCalendar.js
import { useState, useCallback, useEffect } from 'react';
import calendarService from '../services/calendarService';

export const useCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch events for a given date range
  const fetchEvents = useCallback(async (start, end) => {
    setLoading(true);
    setError(null);
    try {
      const fetchedEvents = await calendarService.getEvents(start, end);
      setEvents(fetchedEvents);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch of events
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    fetchEvents(start, end);
  }, [fetchEvents]);

  // Handle event creation
  const createEvent = useCallback(async (choreData) => {
    setError(null);
    try {
      const newEvent = await calendarService.createEvent(choreData);
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Handle event updates
  const updateEvent = useCallback(async (eventId, updates) => {
    setError(null);
    try {
      const updatedEvent = await calendarService.updateEvent(eventId, updates);
      setEvents(prev => 
        prev.map(event => 
          event.id === eventId ? updatedEvent : event
        )
      );
      return updatedEvent;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Handle event deletion
  const deleteEvent = useCallback(async (eventId) => {
    setError(null);
    try {
      await calendarService.deleteEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Handle event completion
  const markEventComplete = useCallback(async (eventId, completionData) => {
    setError(null);
    try {
      const updatedEvent = await calendarService.markEventComplete(eventId, completionData);
      setEvents(prev => 
        prev.map(event => 
          event.id === eventId ? updatedEvent : event
        )
      );
      return updatedEvent;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Handle event drops (rescheduling)
  const handleEventDrop = useCallback(async (eventId, newStart, newEnd) => {
    setError(null);
    try {
      const updatedEvent = await calendarService.handleEventDrop(eventId, newStart, newEnd);
      setEvents(prev => 
        prev.map(event => 
          event.id === eventId ? updatedEvent : event
        )
      );
      return updatedEvent;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    markEventComplete,
    handleEventDrop
  };
};
