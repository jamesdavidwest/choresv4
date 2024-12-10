import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tasks as tasksApi } from '../../services/api';
import AdminTasksList from './AdminTasksList';
import { Alert, AlertDescription } from '../ui/alert';
import { X, Plus } from 'lucide-react';

const TasksManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Redirect if not admin/manager
    if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
      navigate('/dashboard');
      return;
    }

    fetchTasks();
  }, [user, navigate]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await tasksApi.getAll();
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Failed to load tasks data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await tasksApi.delete(taskId);
      // Filter out the deleted task from state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      setSuccessMessage('Task deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const updatedTask = await tasksApi.update(taskId, updates);
      // Update the task in the local state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, ...updatedTask } : task
        )
      );
      setSuccessMessage('Task updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-6">
        <div className="max-w-6xl mx-auto text-white">
          <p className="text-slate-400">Loading tasks management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Tasks Management
          </h1>
          <Link
            to="/tasks/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            <Plus size={20} />
            Create New Task
          </Link>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="flex items-center justify-between">
              {error}
              <button onClick={() => setError(null)} className="text-slate-400 hover:text-slate-300">
                <X size={16} />
              </button>
            </AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="mb-4 bg-green-500/10 text-green-500 border-green-500/20">
            <AlertDescription className="flex items-center justify-between">
              {successMessage}
              <button onClick={() => setSuccessMessage('')} className="text-green-400 hover:text-green-300">
                <X size={16} />
              </button>
            </AlertDescription>
          </Alert>
        )}

        <AdminTasksList
          tasks={tasks}
          onDelete={handleDelete}
          onUpdateTask={handleUpdateTask}
        />
      </div>
    </div>
  );
};

export default TasksManagement;
