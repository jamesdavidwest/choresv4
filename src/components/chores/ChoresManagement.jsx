import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { chores as choresApi, auth } from '../../services/api';
import AdminChoresList from './AdminChoresList';
import { Alert, AlertDescription } from '../ui/alert';
import { X } from 'lucide-react';

const ChoresManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chores, setChores] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Redirect if not admin/manager
    if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
      navigate('/dashboard');
      return;
    }

    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch chores
      const fetchedChores = await choresApi.getAll();

      // Fetch users (assuming auth service can get all users)
      const fetchedUsers = await auth.getCurrentUser();

      // Temporary locations (you might want to replace this with actual location fetching)
      const fetchedLocations = [
        { id: 1, name: 'Kitchen' },
        { id: 2, name: 'Living Room' },
        { id: 3, name: 'Bedroom' }
      ];

      setChores(fetchedChores);
      setLocations(fetchedLocations);
      
      // Filter users if needed
      setUsers(fetchedUsers.role === 'ADMIN' ? [] : [fetchedUsers]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load chores data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (choreId) => {
    try {
      await choresApi.delete(choreId);
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
      const updatedChore = await choresApi.update(choreId, updates);
      setChores(prevChores =>
        prevChores.map(chore =>
          chore.id === choreId ? updatedChore : chore
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
          locations={locations}
          users={users}
          onDelete={handleDelete}
          onUpdateChore={handleUpdateChore}
        />
      </div>
    </div>
  );
};

export default ChoresManagement;
