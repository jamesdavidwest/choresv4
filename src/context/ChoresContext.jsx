import { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { chores as choresApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from './AuthContext';

const ChoresContext = createContext();

export const ChoresProvider = ({ children }) => {
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
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
      console.error('Error in getPersonalChores:', err);
      if (err.status === 401) {
        return [];
      }
      throw err;
    }
  }, [user]);

  const getAllChores = useCallback(async () => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return [];
    }
    try {
      return await choresApi.getAll();
    } catch (err) {
      console.error('Error in getAllChores:', err);
      if (err.status === 401) {
        return [];
      }
      throw err;
    }
  }, [user]);

  const { 
    data: personalChores, 
    loading: personalLoading, 
    error: personalError,
    execute: fetchPersonalChores 
  } = useApi(getPersonalChores, !!user);

  const {
    data: allChores,
    loading: allLoading,
    error: allError,
    execute: fetchAllChores
  } = useApi(() => null, false);

  const toggleChoreComplete = useCallback(async (choreId) => {
    if (!user) {
      throw new Error('User must be logged in to update chores');
    }
    
    try {
      setError(null);
      console.log('Starting toggle for chore:', choreId);
      
      // First, get the current chore to check its status
      const currentChore = await choresApi.getById(choreId);
      console.log('Current chore data:', currentChore);
      
      if (!currentChore) {
        throw new Error(`Chore not found: ${choreId}`);
      }

      if (currentChore.assigned_to !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
        throw new Error('You can only complete chores assigned to you');
      }
      
      // Toggle the completion status
      const newStatus = !currentChore.is_complete;
      console.log('Updating chore status to:', newStatus);
      
      // Update the chore
      await choresApi.update(choreId, {
        ...currentChore,
        is_complete: newStatus,
        last_completed: newStatus ? new Date().toISOString() : null
      });
      
      console.log('Update successful, refreshing data...');
      
      // Refresh the data
      await fetchPersonalChores();
      
      if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        await fetchAllChores();
      }
      
      return true;
    } catch (err) {
      console.error('Toggle chore error:', {
        error: err,
        message: err.message,
        stack: err.stack,
        status: err.status,
        data: err.data,
        choreId,
        userId: user?.id
      });
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