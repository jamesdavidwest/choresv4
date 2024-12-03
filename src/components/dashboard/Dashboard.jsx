import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { CheckCircle, Clock, ListTodo, CheckCircle2, X } from 'lucide-react';
import databaseData from '../../data/database.json';

const QuickStats = ({ stats }) => {
  return (
    <div className="flex justify-between gap-6 mb-8">
      <div className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center">
        <div className="flex flex-col items-center">
          <div className="p-3 bg-green-500/10 rounded-xl mb-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Completed Today</p>
          <h3 className="text-3xl font-bold text-white">{stats.completedToday}</h3>
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center">
        <div className="flex flex-col items-center">
          <div className="p-3 bg-amber-500/10 rounded-xl mb-2">
            <Clock className="h-6 w-6 text-amber-500" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Pending Today</p>
          <h3 className="text-3xl font-bold text-white">{stats.pendingToday}</h3>
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center">
        <div className="flex flex-col items-center">
          <div className="p-3 bg-blue-500/10 rounded-xl mb-2">
            <ListTodo className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Total Today</p>
          <h3 className="text-3xl font-bold text-white">{stats.totalToday}</h3>
        </div>
      </div>
    </div>
  );
};

QuickStats.propTypes = {
  stats: PropTypes.shape({
    completedToday: PropTypes.number.isRequired,
    pendingToday: PropTypes.number.isRequired,
    totalToday: PropTypes.number.isRequired
  }).isRequired
};

const ChoresList = ({ chores, locations, onToggleComplete }) => {
  const [activeFrequency, setActiveFrequency] = useState('0');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  
  const frequencyTypes = {
    0: 'All',
    1: 'Daily',
    2: 'Weekly',
    3: 'Monthly',
    4: 'Quarterly',
    5: 'Yearly'
  };

  const getLocationName = (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown';
  };

  const sortedChores = [...chores]
    .filter(chore => activeFrequency === '0' || chore.frequency_id === parseInt(activeFrequency))
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800/50">
      {/* Frequency Filter Buttons */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        {Object.entries(frequencyTypes).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveFrequency(id)}
            className={`py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeFrequency === id
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chores Table */}
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
              <th className="p-3 cursor-pointer" onClick={() => handleSort('location_id')}>
                Location
              </th>
              <th className="p-3">Frequency</th>
              <th className="p-3 cursor-pointer" onClick={() => handleSort('last_completed')}>
                Last Completed
              </th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedChores.map(chore => (
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
                  {getLocationName(chore.location_id)}
                </td>
                <td className="p-3 text-slate-400">
                  {frequencyTypes[chore.frequency_id]}
                </td>
                <td className="p-3 text-slate-400">
                  {chore.last_completed 
                    ? new Date(chore.last_completed).toLocaleDateString() 
                    : 'Never'}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => onToggleComplete(chore.id)}
                    className={`
                      p-2 rounded-lg transition-all duration-200 
                      ${chore.is_complete 
                        ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                        : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                      }
                    `}
                  >
                    {chore.is_complete ? <X className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

ChoresList.propTypes = {
  chores: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    frequency_id: PropTypes.number.isRequired,
    location_id: PropTypes.number.isRequired,
    is_complete: PropTypes.bool,
    last_completed: PropTypes.string
  })).isRequired,
  locations: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  onToggleComplete: PropTypes.func.isRequired
};

const Dashboard = () => {
  const [chores, setChores] = useState([]);
  const [locations, setLocations] = useState([]);
  const [stats, setStats] = useState({
    completedToday: 0,
    pendingToday: 0,
    totalToday: 0
  });

  useEffect(() => {
    const userChores = databaseData.chores.filter(chore => chore.assigned_to === 4);
    setChores(userChores);
    setLocations(databaseData.locations);

    updateStats(userChores);
  }, []);

  const updateStats = (choreList) => {
    const completed = choreList.filter(chore => chore.is_complete).length;
    const total = choreList.length;
    const pending = total - completed;
    
    setStats({
      completedToday: completed,
      pendingToday: pending,
      totalToday: total
    });
  };

  const handleToggleComplete = (choreId) => {
    const updatedChores = chores.map(chore =>
      chore.id === choreId
        ? { ...chore, is_complete: !chore.is_complete }
        : chore
    );
    
    setChores(updatedChores);
    updateStats(updatedChores);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          My Dashboard
        </h1>
        <QuickStats stats={stats} />
        <ChoresList 
          chores={chores} 
          locations={locations} 
          onToggleComplete={handleToggleComplete} 
        />
      </div>
    </div>
  );
};

export default Dashboard;
