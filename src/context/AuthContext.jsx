// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { auth } from '../services/api';

const AuthContext = createContext();

const publicRoutes = ['/signin', '/signup', '/'];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentPath = window.location.pathname;
        console.log('AuthProvider: Initializing auth. Current path:', currentPath);
        
        // If we're on a public route, just set loading to false
        if (publicRoutes.includes(currentPath)) {
          console.log('AuthProvider: On public route, skipping auth check');
          setLoading(false);
          return;
        }

        // Check for token
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('AuthProvider: No token found, redirecting to signin');
          window.location.pathname = '/signin';
          return;
        }

        // Try to get current user
        try {
          console.log('AuthProvider: Getting current user');
          const userData = await auth.getCurrentUser();
          console.log('AuthProvider: User data received:', userData);
          setUser(userData);
        } catch (error) {
          console.error('AuthProvider: Failed to get current user:', error);
          setError(error.message);
          if (!publicRoutes.includes(currentPath)) {
            window.location.pathname = '/signin';
          }
        }
      } finally {
        console.log('AuthProvider: Setting loading to false');
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await auth.login(credentials);
      if (response.user) {
        setUser(response.user);
        window.location.pathname = '/dashboard';
        return response.user;
      }
      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    auth.logout();
    setUser(null);
    window.location.pathname = '/signin';
  };

  const value = {
    user,
    login,
    logout,
    loading,
    error,
    isAuthenticated: !!user
  };

  // Only show loading spinner when initializing auth
  if (loading && !user && !publicRoutes.includes(window.location.pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
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