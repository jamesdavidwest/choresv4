import { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { tasks as tasksApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from './AuthContext';

const TasksContext = createContext();

export const TasksProvider = ({ children }) => {
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  const getPersonalTasks = useCallback(async () => {
    if (!user) {
      return [];
    }
    try {
      const allTasks = await tasksApi.getAll();
      console.log('All tasks before filtering:', allTasks);
      
      const filteredTasks = allTasks.filter(task => {
        return task.assigned_to === user.id;
      });
      
      console.log('Filtered tasks:', filteredTasks);
      return filteredTasks;
    } catch (err) {
      console.error('Error in getPersonalTasks:', err);
      if (err.status === 401) {
        return [];
      }
      throw err;
    }
  }, [user]);

  const getAllTasks = useCallback(async () => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return [];
    }
    try {
      return await tasksApi.getAll();
    } catch (err) {
      console.error('Error in getAllTasks:', err);
      if (err.status === 401) {
        return [];
      }
      throw err;
    }
  }, [user]);

  const { 
    data: personalTasks, 
    loading: personalLoading, 
    error: personalError,
    execute: fetchPersonalTasks 
  } = useApi(getPersonalTasks, !!user);

  const {
    data: allTasks,
    loading: allLoading,
    error: allError,
    execute: fetchAllTasks
  } = useApi(getAllTasks, !!(user?.role === 'ADMIN' || user?.role === 'MANAGER'));

  const createTask = useCallback(async (taskData) => {
    if (!user) {
      throw new Error('User must be logged in to create tasks');
    }

    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      throw new Error('Only admins and managers can create tasks');
    }

    try {
      setError(null);
      console.log('Creating new task with data:', taskData);

      const newTask = await tasksApi.create(taskData);
      console.log('Task created successfully:', newTask);

      // Refresh the data
      await fetchPersonalTasks();
      await fetchAllTasks();

      return newTask;
    } catch (err) {
      console.error('Create task error:', {
        error: err,
        message: err.message,
        stack: err.stack,
        taskData,
        userId: user?.id
      });
      setError(err.message || 'Failed to create task');
      throw err;
    }
  }, [fetchPersonalTasks, fetchAllTasks, user]);

  const toggleTaskComplete = useCallback(async (taskId, instanceId) => {
    if (!user) {
      throw new Error('User must be logged in to update tasks');
    }
    
    try {
      setError(null);
      console.log('Starting toggle for task:', taskId, 'instance:', instanceId);
      
      // If we have an instance ID, use the instance-specific endpoint
      if (instanceId) {
        await tasksApi.toggleComplete(taskId, instanceId);
      } else {
        // Legacy behavior for tasks without instances
        const currentTask = await tasksApi.getById(taskId);
        console.log('Current task data:', currentTask);
        
        if (!currentTask) {
          throw new Error(`Task not found: ${taskId}`);
        }

        if (currentTask.assigned_to !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
          throw new Error('You can only complete tasks assigned to you');
        }
        
        await tasksApi.toggleComplete(taskId);
      }
      
      console.log('Update successful, refreshing data...');
      
      // Refresh the data
      await fetchPersonalTasks();
      
      if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        await fetchAllTasks();
      }
      
      return true;
    } catch (err) {
      console.error('Toggle task error:', {
        error: err,
        message: err.message,
        stack: err.stack,
        status: err.status,
        data: err.data,
        taskId,
        instanceId,
        userId: user?.id
      });
      setError(err.message || 'Failed to update task');
      throw err;
    }
  }, [fetchPersonalTasks, fetchAllTasks, user]);

  const value = {
    personalTasks: personalTasks || [],
    personalLoading,
    allTasks: allTasks || [],
    allLoading,
    canManageTasks: user?.role === 'ADMIN' || user?.role === 'MANAGER',
    error: error || personalError || allError,
    toggleTaskComplete,
    createTask,
    refreshPersonalTasks: fetchPersonalTasks,
    refreshAllTasks: fetchAllTasks
  };

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
};

TasksProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};

export default TasksContext;
