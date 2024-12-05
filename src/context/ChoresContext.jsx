import { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { chores as choresApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from './AuthContext';

const ChoresContext = createContext();

export const ChoresProvider = ({ children }) => {
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  // Function to get personal chores (for Dashboard)
  const getPersonalChores = useCallback(async () => {
    if (!user) {
      return [];
    }
    try {
      const allChores = await choresApi.getAll();
      console.log('All chores before filtering:', allChores);
      
      const filteredChores = allChores.filter(chore => {
        return chore.assigned_to === user.id;
      });
      
      console.log('Filtered chores:', filteredChores);
      return filteredChores;
    } catch (err) {
      if (err.status === 401) {
        return []; // Return empty array for unauthorized users
      }
      throw err;
    }
  }, [user]);

  // Function to get all chores (for Manage Chores view)
  const getAllChores = useCallback(async () => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return [];
    }
    try {
      return await choresApi.getAll();
    } catch (err) {
      if (err.status === 401) {
        return []; // Return empty array for unauthorized users
      }
      throw err;
    }
  }, [user]);

  const { 
    data: personalChores, 
    loading: personalLoading, 
    error: personalError,
    execute: fetchPersonalChores 
  } = useApi(getPersonalChores, !!user); // Only fetch if user exists

  const {
    data: allChores,
    loading: allLoading,
    error: allError,
    execute: fetchAllChores
  } = useApi(() => null, false); // Don't fetch automatically

  const toggleChoreComplete = useCallback(async (choreId) => {
    if (!user) return;
    
    try {
      setError(null);
      
      const currentChore = await choresApi.getById(choreId);
      
      if (currentChore.assigned_to !== user.id) {
        throw new Error('You can only complete chores assigned to you');
      }
      
      await choresApi.toggleComplete(choreId, !currentChore.is_complete);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchPersonalChores();
      
      if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        await fetchAllChores();
      }
    } catch (err) {
      console.error('ChoresContext error:', err);
      setError(err.message || 'Failed to update chore');
      throw err;
    }
  }, [fetchPersonalChores, fetchAllChores, user]);

  const value = {
    personalChores: personalChores || [],
    personalLoading,
    allChores: allChores || [],
    allLoading,
    canManageChores: user?.role === 'ADMIN' || user?.role === 'MANAGER',
    error: error || personalError || allError,
    toggleChoreComplete,
    refreshPersonalChores: fetchPersonalChores,
    refreshAllChores: fetchAllChores
  };

  return (
    <ChoresContext.Provider value={value}>
      {children}
    </ChoresContext.Provider>
  );
};

ChoresProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useChores = () => {
  const context = useContext(ChoresContext);
  if (!context) {
    throw new Error('useChores must be used within a ChoresProvider');
  }
  return context;
};

export default ChoresContext;