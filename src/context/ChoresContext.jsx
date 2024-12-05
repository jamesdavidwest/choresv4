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
    const allChores = await choresApi.getAll();
    console.log('Current user:', user);
    console.log('All chores before filtering:', allChores);
    
    const filteredChores = allChores.filter(chore => {
      console.log(`Comparing chore assigned_to: ${chore.assigned_to} with user.id: ${user.id}`);
      return chore.assigned_to === user.id;
    });
    
    console.log('Filtered chores:', filteredChores);
    return filteredChores;
  }, [user]);

  // Function to get all chores (for Manage Chores view)
  const getAllChores = useCallback(async () => {
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      throw new Error('Unauthorized access to manage chores');
    }
    return await choresApi.getAll();
  }, [user]);

  const { 
    data: personalChores, 
    loading: personalLoading, 
    error: personalError,
    execute: fetchPersonalChores 
  } = useApi(getPersonalChores);

  const {
    data: allChores,
    loading: allLoading,
    error: allError,
    execute: fetchAllChores
  } = useApi(() => null, false); // Don't fetch automatically, only when requested

  const toggleChoreComplete = useCallback(async (choreId) => {
    try {
      setError(null);
      
      const currentChore = await choresApi.getById(choreId);
      
      // For completing chores, only check if the chore is assigned to the user
      if (currentChore.assigned_to !== user.id) {
        throw new Error('You can only complete chores assigned to you');
      }
      
      await choresApi.toggleComplete(choreId, !currentChore.is_complete);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchPersonalChores();
      // If we're in manage view, refresh that too
      if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        await fetchAllChores();
      }
    } catch (err) {
      console.error('ChoresContext error:', err);
      setError(err.message || 'Failed to update chore');
      throw err;
    }
  }, [fetchPersonalChores, fetchAllChores, user]);

  // Debug log for the context value
  const value = {
    // For Dashboard
    personalChores: personalChores || [],
    personalLoading,
    
    // For Manage Chores
    allChores: allChores || [],
    allLoading,
    canManageChores: user?.role === 'ADMIN' || user?.role === 'MANAGER',
    
    // Shared
    error: error || personalError || allError,
    toggleChoreComplete,
    refreshPersonalChores: fetchPersonalChores,
    refreshAllChores: fetchAllChores
  };
  
  console.log('ChoresContext value:', {
    personalChoresCount: value.personalChores.length,
    allChoresCount: value.allChores.length,
    userRole: user?.role,
    userId: user?.id
  });

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