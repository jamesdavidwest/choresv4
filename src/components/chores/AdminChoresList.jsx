import { useState, useEffect } from 'react';
import { CheckCircle, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Dropdown } from '../ui/dropdown';
import { chores as choresApi } from '../../services/api';

const FREQUENCIES = {
  0: 'All',
  1: 'Daily',
  2: 'Weekly', 
  3: 'Monthly',
  4: 'Quarterly',
  5: 'Yearly'
};

const AdminChoresList = () => {
  const { user } = useAuth();
  const [chores, setChores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Filter states
  const [activeFrequency, setActiveFrequency] = useState(0);
  const [selectedUser, setSelectedUser] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(0);
  
  // Sorting configuration
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // States for users and locations
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedChores, data] = await Promise.all([
        choresApi.getAll(),
        window.fs.readFile('Simple Database Schema.txt', { encoding: 'utf8' })
          .then(content => JSON.parse(content))
      ]);

      // Prepare users and locations with "All" option
      setUsers([{ id: 0, name: 'All Users' }, ...data.users]);
      setLocations([{ id: 0, name: 'All Locations' }, ...data.locations]);

      // Enhance chores with location and user names
      const enhancedChores = fetchedChores.map(chore => {
        const location = data.locations.find(loc => loc.id === chore.location_id);
        const assignedUser = data.users.find(u => u.id === chore.assigned_to);
        
        return {
          ...chore,
          locationName: location ? location.name : 'Unknown Location',
          assignedUserName: assignedUser ? assignedUser.name : 'Unassigned'
        };
      });

      setChores(enhancedChores);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load chores data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteToggle = async (choreId) => {
    if (user && (user.role === 'ADMIN' || user.role === 'MANAGER')) {
      try {
        const chore = chores.find(c => c.id === choreId);
        await choresApi.toggleComplete(choreId, !chore.is_complete);
        
        setChores(prevChores => prevChores.map(c =>
          c.id === choreId
            ? { 
                ...c, 
                is_complete: !c.is_complete,
                last_completed: !c.is_complete ? new Date().toISOString() : null
              }
            : c
        ));

        setSuccessMessage(`Chore marked as ${!chore.is_complete ? 'complete' : 'incomplete'}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Toggle complete error:', error);
        setError('Failed to update chore status. Please try again.');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const handleDeleteChore = async (choreId) => {
    if (user && user.role === 'ADMIN') {
      try {
        await choresApi.delete(choreId);
        setChores(prevChores => prevChores.filter(chore => chore.id !== choreId));
        setSuccessMessage('Chore deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Delete chore error:', error);
        setError('Failed to delete chore. Please try again.');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filtering and sorting logic
  const filteredChores = chores
    .filter(chore => 
      (activeFrequency === 0 || chore.frequency_id === activeFrequency) &&
      (selectedUser === 0 || chore.assigned_to === selectedUser) &&
      (selectedLocation === 0 || chore.location_id === selectedLocation)
    )
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-slate-400">Loading chores management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Chores Management
        </h1>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500">
            {successMessage}
          </div>
        )}

        {/* Filters Container */}
        <div className="mb-8 space-y-4">
          {/* Filter Dropdowns */}
          <div className="grid grid-cols-3 gap-4">
            <Dropdown 
              options={users} 
              selectedValue={selectedUser} 
              onSelect={setSelectedUser} 
              placeholder="Select User"
            />
            <Dropdown 
              options={locations} 
              selectedValue={selectedLocation} 
              onSelect={setSelectedLocation} 
              placeholder="Select Location"
            />
            <Dropdown 
              options={Object.entries(FREQUENCIES).map(([id, name]) => ({ 
                id: parseInt(id), 
                name 
              }))} 
              selectedValue={activeFrequency} 
              onSelect={setActiveFrequency} 
              placeholder="Select Frequency"
            />
          </div>
        </div>

        {/* Chores Table */}
        <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-slate-300">
                  <th className="p-3 cursor-pointer" onClick={() => handleSort('is_complete')}>
                    Status
                  </th>
                  <th className="p-3 cursor-pointer" onClick={() => handleSort('name')}>
                    Task Name
                  </th>
                  <th className="p-3 cursor-pointer" onClick={() => handleSort('assignedUserName')}>
                    Assigned To
                  </th>
                  <th className="p-3 cursor-pointer" onClick={() => handleSort('locationName')}>
                    Location
                  </th>
                  <th className="p-3">Frequency</th>
                  <th className="p-3">Last Completed</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredChores.map(chore => (
                  <tr 
                    key={chore.id} 
                    className={`
                      border-b border-slate-800 
                      ${chore.is_complete 
                        ? 'bg-green-900/20 hover:bg-green-900/30' 
                        : 'bg-slate-900/50 hover:bg-slate-800/50'
                      } 
                      transition-colors duration-200
                    `}
                  >
                    <td className="p-3">
                      {chore.is_complete ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </td>
                    <td className={`p-3 ${chore.is_complete ? 'line-through text-slate-500' : 'text-white'}`}>
                      {chore.name}
                    </td>
                    <td className="p-3 text-slate-400">
                      {chore.assignedUserName}
                    </td>
                    <td className="p-3 text-slate-400">
                      {chore.locationName}
                    </td>
                    <td className="p-3 text-slate-400">
                      {FREQUENCIES[chore.frequency_id]}
                    </td>
                    <td className="p-3 text-slate-400">
                      {chore.last_completed 
                        ? new Date(chore.last_completed).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="p-3 space-x-2">
                      {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                        <button
                          onClick={() => handleCompleteToggle(chore.id)}
                          className={`
                            p-2 rounded-lg transition-all duration-200 
                            ${chore.is_complete 
                              ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                              : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                            }
                          `}
                          title={chore.is_complete ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                          {chore.is_complete ? <X className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </button>
                      )}
                      {user.role === 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteChore(chore.id)}
                          className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30"
                          title="Delete chore"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChoresList;
