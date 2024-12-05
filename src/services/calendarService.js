// src/services/calendarService.js
import * as axios from 'axios';
import { choreToEvent, calculateNextOccurrence } from '../components/calendar/calendarUtils';

const API_BASE_URL = 'http://localhost:3001/api';

class CalendarService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  // Fetch events for a given date range
  async getEvents(start, end) {
    try {
      const cacheKey = `${start}-${end}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Prevent duplicate requests
      if (this.pendingRequests.has(cacheKey)) {
        return this.pendingRequests.get(cacheKey);
      }

      const request = axios.get(`${API_BASE_URL}/calendar/events`, {
        params: { start, end }
      });
      
      this.pendingRequests.set(cacheKey, request);

      const response = await request;
      const events = response.data.map(chore => choreToEvent(chore));
      
      // Cache the results
      this.cache.set(cacheKey, events);
      this.pendingRequests.delete(cacheKey);

      return events;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  // Create a new event
  async createEvent(choreData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/calendar/events`, choreData);
      return choreToEvent(response.data);
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  // Update an existing event
  async updateEvent(eventId, updates) {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/calendar/events/${eventId}`, 
        updates
      );
      return choreToEvent(response.data);
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  // Delete an event
  async deleteEvent(eventId) {
    try {
      await axios.delete(`${API_BASE_URL}/calendar/events/${eventId}`);
      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }

  // Mark event as completed
  async markEventComplete(eventId, completionData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/calendar/events/${eventId}/complete`,
        completionData
      );
      return choreToEvent(response.data);
    } catch (error) {
      console.error('Error marking event as complete:', error);
      throw new Error('Failed to mark event as complete');
    }
  }

  // Get upcoming events for a specific user
  async getUpcomingEvents(userId, limit = 10) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/calendar/next-occurrences`,
        { params: { userId, limit } }
      );
      return response.data.map(chore => choreToEvent(chore));
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw new Error('Failed to fetch upcoming events');
    }
  }

  // Clear cache for a specific range or all cache
  clearCache(start, end) {
    if (start && end) {
      const cacheKey = `${start}-${end}`;
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  // Handle event drops (rescheduling)
  async handleEventDrop(eventId, newStart, newEnd) {
    try {
      const updates = {
        start_date: newStart,
        end_date: newEnd || newStart
      };
      
      const response = await this.updateEvent(eventId, updates);
      this.clearCache(); // Clear cache as dates have changed
      return response;
    } catch (error) {
      console.error('Error handling event drop:', error);
      throw new Error('Failed to reschedule event');
    }
  }
}

export default new CalendarService();