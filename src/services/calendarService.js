// src/services/calendarService.js
import { fetchWithAuth, ApiError } from './api';

class CalendarService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  // Helper method to create cache key
  createCacheKey(start, end, userId = '') {
    return `${start}-${end}-${userId}`;
  }

  // Fetch events for a given date range
  async getEvents(start, end, userId = null) {
    try {
      const cacheKey = this.createCacheKey(start, end, userId);
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Check for pending requests
      if (this.pendingRequests.has(cacheKey)) {
        return this.pendingRequests.get(cacheKey);
      }

      // Create the promise for this request
      const requestPromise = fetchWithAuth(
        `/calendar/events?${new URLSearchParams({
          startDate: start,
          endDate: end,
          ...(userId && { userId: userId })
        })}`,
        {},
        'calendar.getEvents'
      );
      
      this.pendingRequests.set(cacheKey, requestPromise);

      const response = await requestPromise;
      
      // Cache the results
      this.cache.set(cacheKey, response);
      this.pendingRequests.delete(cacheKey);

      // Clear cache after 5 minutes
      setTimeout(() => this.cache.delete(cacheKey), 300000);

      return response;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch calendar events', 500, error, 'calendar.getEvents');
    }
  }

  // Create a new event
  async createEvent(eventData) {
    if (!eventData.taskId) {
      throw new ApiError('Task ID is required', 400, null, 'calendar.createEvent');
    }

    try {
      const response = await fetchWithAuth(
        '/calendar/events',
        {
          method: 'POST',
          body: JSON.stringify(eventData)
        },
        'calendar.createEvent'
      );

      // Clear cache as data has changed
      this.clearCache();
      
      return response;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to create calendar event', 500, error, 'calendar.createEvent');
    }
  }

  // Update an existing event
  async updateEvent(eventId, updates) {
    if (!eventId) {
      throw new ApiError('Event ID is required', 400, null, 'calendar.updateEvent');
    }

    try {
      const response = await fetchWithAuth(
        `/calendar/events/${eventId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates)
        },
        'calendar.updateEvent'
      );

      // Clear cache as data has changed
      this.clearCache();
      
      return response;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to update calendar event', 500, error, 'calendar.updateEvent');
    }
  }

  // Delete an event
  async deleteEvent(eventId) {
    if (!eventId) {
      throw new ApiError('Event ID is required', 400, null, 'calendar.deleteEvent');
    }

    try {
      await fetchWithAuth(
        `/calendar/events/${eventId}`,
        {
          method: 'DELETE'
        },
        'calendar.deleteEvent'
      );

      // Clear cache as data has changed
      this.clearCache();
      
      return true;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to delete calendar event', 500, error, 'calendar.deleteEvent');
    }
  }

  // Mark event as completed
  async markEventComplete(eventId, completionData = {}) {
    if (!eventId) {
      throw new ApiError('Event ID is required', 400, null, 'calendar.markEventComplete');
    }

    try {
      const response = await fetchWithAuth(
        `/calendar/events/${eventId}/complete`,
        {
          method: 'PUT',
          body: JSON.stringify(completionData)
        },
        'calendar.markEventComplete'
      );

      // Clear cache as data has changed
      this.clearCache();
      
      return response;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to mark event as complete', 500, error, 'calendar.markEventComplete');
    }
  }

  // Get upcoming events for a specific user
  async getUpcomingEvents(userId, limit = 10) {
    if (!userId) {
      throw new ApiError('User ID is required', 400, null, 'calendar.getUpcomingEvents');
    }

    try {
      return await fetchWithAuth(
        `/calendar/next-occurrences?${new URLSearchParams({
          userId,
          limit: limit.toString()
        })}`,
        {},
        'calendar.getUpcomingEvents'
      );
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch upcoming events', 500, error, 'calendar.getUpcomingEvents');
    }
  }

  // Generate instances for a task
  async generateInstances(taskId, startDate, endDate) {
    if (!taskId) {
      throw new ApiError('Task ID is required', 400, null, 'calendar.generateInstances');
    }
    if (!startDate || !endDate) {
      throw new ApiError('Start and end dates are required', 400, null, 'calendar.generateInstances');
    }

    try {
      const response = await fetchWithAuth(
        '/calendar/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            taskId,
            startDate,
            endDate
          })
        },
        'calendar.generateInstances'
      );

      // Clear cache as new instances have been generated
      this.clearCache();
      
      return response;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to generate instances', 500, error, 'calendar.generateInstances');
    }
  }

  // Handle event drops (rescheduling)
  async handleEventDrop(eventId, newStart, newEnd) {
    if (!eventId || !newStart) {
      throw new ApiError('Event ID and new start date are required', 400, null, 'calendar.handleEventDrop');
    }

    try {
      const response = await this.updateEvent(eventId, {
        startDate: newStart,
        endDate: newEnd || newStart
      });

      // Clear cache as event dates have changed
      this.clearCache();
      
      return response;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to reschedule event', 500, error, 'calendar.handleEventDrop');
    }
  }

  // Clear cache for a specific range or all cache
  clearCache(start = null, end = null, userId = null) {
    if (start && end) {
      const cacheKey = this.createCacheKey(start, end, userId);
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }
}

export default new CalendarService();