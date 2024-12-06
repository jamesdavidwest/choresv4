import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { chores as choresApi } from '../../services/api';
import AdminChoresList from './AdminChoresList';
import { Alert, AlertDescription } from '../ui/alert';
import { X, Plus } from 'lucide-react';
import database from '../../data/database.json';

const ChoresManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chores, setChores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Redirect if not admin/manager
    if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
      navigate('/dashboard');
      return;
    }

    fetchChores();
  }, [user, navigate]);

  const fetchChores = async () => {
    try {
      setLoading(true);
      // Map the chores from database.json
      setChores(database.chores.map(chore => {
        const location = database.locations.find(l => l.id === chore.location_id);
        const assignedUser = database.users.find(u => u.id === chore.assigned_to);
        return {
          ...chore,
          locationName: location ? location.name : 'Unknown Location',
          assignedUserName: assignedUser ? assignedUser.name : 'Unassigned',
          is_complete: false // You might want to get this from another source
        };
      }));
    } catch (error) {
      console.error('Error loading chores:', error);
      setError('Failed to load chores data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (choreId) => {
    try {
      // Filter out the deleted chore immediately
      setChores(prevChores => prevChores.filter(chore => chore.id !== choreId));
      setSuccessMessage('Chore deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting chore:', error);
      setError('Failed to delete chore. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateChore = async (choreId, updates) => {
    try {
      // Update the chore in the local state
      setChores(prevChores =>
        prevChores.map(chore =>
          chore.id === choreId ? { ...chore, ...updates } : chore
        )
      );
      setSuccessMessage('Chore updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating chore:', error);
      setError('Failed to update chore. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-6">
        <div className="max-w-6xl mx-auto text-white">
          <p className="text-slate-400">Loading chores management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Chores Management
          </h1>
          <Link
            to="/chores/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            <Plus size={20} />
            Create New Chore
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

        <AdminChoresList
          chores={chores}
          onDelete={handleDelete}
          onUpdateChore={handleUpdateChore}
        />
      </div>
    </div>
  );
};

export default ChoresManagement;