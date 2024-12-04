import { api } from './api';

export const authApi = {
  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },

  // Register user
  register: (userData) => api.post('/auth/register', userData),

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Get current auth token
  getToken: () => localStorage.getItem('token'),
};