// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { auth } from '../services/api';

const AuthContext = createContext();

const publicRoutes = ['/signin', '/signup', '/'];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentPath = window.location.pathname;
        
        // If we're on a public route, just set loading to false
        if (publicRoutes.includes(currentPath)) {
          setLoading(false);
          return;
        }

        // Check for token
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.pathname = '/signin';
          return;
        }

        // Try to get current user
        try {
          const userData = await auth.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to get current user:', error);
          if (!publicRoutes.includes(currentPath)) {
            window.location.pathname = '/signin';
          }
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await auth.login(credentials);
      if (response.user) {
        setUser(response.user);
        window.location.pathname = '/dashboard';
        return response.user;
      }
      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    auth.logout();
    setUser(null);
    window.location.pathname = '/signin';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};