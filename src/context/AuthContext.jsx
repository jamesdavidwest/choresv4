// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check for user in localStorage on initial load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // RequireAuth component for protected routes
  const RequireAuth = ({ children }) => {
    if (loading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated()) {
      // Redirect to signin page but save the attempted URL
      return <Navigate to="/signin" state={{ from: location }} replace />;
    }

    return children;
  };

  // Add prop type validation for RequireAuth
  RequireAuth.propTypes = {
    children: PropTypes.node.isRequired
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    RequireAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Add prop type validation for AuthProvider
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

export default AuthContext;
