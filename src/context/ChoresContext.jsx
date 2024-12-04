import { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { chores as choresApi } from '../services/api';
import { useApi } from '../hooks/useApi';

const ChoresContext = createContext();

export const ChoresProvider = ({ children }) => {
  const [error, setError] = useState(null);
  
  const { 
    data: chores, 
    loading, 
    error: apiError,
    execute: fetchChores 
  } = useApi(choresApi.getAll);

  const toggleChoreComplete = useCallback(async (choreId) => {
    try {
      const chore = chores.find(c => c.id === choreId);
      if (!chore) {
        throw new Error(`Chore with ID ${choreId} not found`);
      }
      
      await choresApi.toggleComplete(choreId, !chore.is_complete);
      await fetchChores();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [chores, fetchChores]);

  const value = {
    chores: chores || [],
    loading,
    error: error || apiError,
    toggleChoreComplete,
    refreshChores: fetchChores
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