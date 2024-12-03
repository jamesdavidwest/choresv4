// src/components/chores/ChoresManagement.jsx
import { useAuth } from '../../context/AuthContext';
import AdminChoresList from './AdminChoresList';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import database from '../../data/database.json';

const ChoresManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chores, setChores] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Redirect if not admin/manager
    if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
      navigate('/dashboard');
      return;
    }

    try {
      // Use imported database directly
      const data = database;
      
      // Ensure we have the required data structures
      if (!Array.isArray(data.chores) || !Array.isArray(data.locations) || !Array.isArray(data.users)) {
        throw new Error('Invalid data structure');
      }

      setChores(data.chores || []);
      setLocations(data.locations || []);
      setUsers(data.users.filter(user => user.role === 'USER') || []);
    } catch (error) {
      console.error('Error in ChoresManagement:', error);
      setError(error.message);
    }
  }, [user, navigate]);

  const handleDelete = (choreId) => {
    setChores(prevChores => prevChores.filter(chore => chore.id !== choreId));
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  if (!chores.length && !error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading chores...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <AdminChoresList
        chores={chores}
        locations={locations}
        users={users}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default ChoresManagement;
