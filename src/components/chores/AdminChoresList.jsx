// src/components/chores/AdminChoresList.jsx
import { useState, useEffect } from 'react';
import { db } from '../../data';
import { useAuth } from '../../context/AuthContext';

const FREQUENCIES = {
  ALL: 0,
  DAILY: 1,
  WEEKLY: 2,
  MONTHLY: 3,
  QUARTERLY: 4,
  YEARLY: 5
};

const AdminChoresList = () => {
  const { user } = useAuth();
  const [chores, setChores] = useState([]);
  const [choreCompletions, setChoreCompletions] = useState({});
  const [selectedFrequency, setSelectedFrequency] = useState(FREQUENCIES.ALL);

  useEffect(() => {
    // Enhance chores with location and assigned user names
    const enhancedChores = db.chores.map(chore => {
      const location = db.locations.find(loc => loc.id === chore.location_id);
      const assignedUser = db.users.find(u => u.id === chore.assigned_to);
      
      return {
        ...chore,
        locationName: location ? location.name : 'Unknown Location',
        assignedUserName: assignedUser ? assignedUser.name : 'Unassigned'
      };
    });

    setChores(enhancedChores);
  }, []);

  const handleCompleteToggle = (choreId) => {
    // Only ADMIN and MANAGERS can mark complete/incomplete
    if (user && (user.role === 'ADMIN' || user.role === 'MANAGER')) {
      setChoreCompletions(prev => ({
        ...prev,
        [choreId]: !prev[choreId]
      }));
    }
  };

  const handleDeleteChore = (choreId) => {
    // Only ADMIN can delete chores
    if (user && user.role === 'ADMIN') {
      setChores(prevChores => 
        prevChores.filter(chore => chore.id !== choreId)
      );
    }
  };

  const filteredChores = selectedFrequency === FREQUENCIES.ALL 
    ? chores 
    : chores.filter(chore => chore.frequency_id === selectedFrequency);

  return (
    <div className="space-y-4 dark:bg-dark-900">
      <div className="flex justify-center space-x-2 mb-4">
        {Object.entries(FREQUENCIES).map(([key, value]) => (
          value !== 0 && (
            <button
              key={key}
              onClick={() => setSelectedFrequency(value)}
              className={`px-4 py-2 rounded ${
                selectedFrequency === value 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 dark:bg-dark-700 dark:text-gray-300'
              }`}
            >
              {key}
            </button>
          )
        ))}
        <button
          onClick={() => setSelectedFrequency(FREQUENCIES.ALL)}
          className={`px-4 py-2 rounded ${
            selectedFrequency === FREQUENCIES.ALL 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 dark:bg-dark-700 dark:text-gray-300'
          }`}
        >
          All
        </button>
      </div>

      {filteredChores.map((chore) => (
        <div 
          key={chore.id} 
          className={`bg-white p-4 rounded-lg shadow-sm dark:bg-dark-800 dark:text-gray-100 dark:border-dark-700 border 
            ${choreCompletions[chore.id] ? 'opacity-50' : ''}`}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold dark:text-gray-200">{chore.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Assigned to: {chore.assignedUserName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Location: {chore.locationName}
              </p>
              <p className={`text-sm font-semibold ${choreCompletions[chore.id] ? 'text-green-600' : 'text-red-600'}`}>
                Status: {choreCompletions[chore.id] ? 'Complete' : 'Incomplete'}
              </p>
            </div>
            <div className="flex space-x-2">
              {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                <button 
                  onClick={() => handleCompleteToggle(chore.id)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 
                             dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  {choreCompletions[chore.id] ? 'Mark Incomplete' : 'Mark Complete'}
                </button>
              )}
              {user.role === 'ADMIN' && (
                <button 
                  onClick={() => handleDeleteChore(chore.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600
                             dark:bg-red-700 dark:hover:bg-red-600"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminChoresList;
