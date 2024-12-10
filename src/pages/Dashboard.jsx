import { useState } from 'react';
import { CheckCircle, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Dropdown } from '../components/ui/dropdown';
import { useTasks } from '../context/TasksContext';
import { useTasksStats } from '../hooks/useTasksStats';
import { useApi } from '../hooks/useApi';
import { locations as locationsApi } from '../services/api';
import QuickStats from '../components/dashboard/QuickStats';

const FREQUENCIES = {
  0: 'All Frequencies',
  1: 'Daily',
  2: 'Weekly', 
  3: 'Monthly',
  4: 'Quarterly',
  5: 'Yearly'
};

const Dashboard = () => {
  const { user } = useAuth();
  const { personalTasks: tasks, personalLoading: isLoadingTasks, error: tasksError, toggleTaskComplete } = useTasks();
  const { data: locations, loading: isLoadingLocations } = useApi(locationsApi.getAll);
  const stats = useTasksStats(tasks);
  
  // Filter states
  const [activeFrequency, setActiveFrequency] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Sorting configuration
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  if (isLoadingTasks || isLoadingLocations) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (tasksError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-red-500">
            Error loading tasks: {tasksError.message}
          </div>
        </div>
      </div>
    );
  }

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleCompleteToggle = async (taskId) => {
    try {
      await toggleTaskComplete(taskId);
      setSuccessMessage('Task status updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Toggle complete error:', error);
    }
  };

  // Filtering and sorting logic
  const filteredTasks = (tasks || [])
    .filter(task => 
      (activeFrequency === 0 || task.frequency_id === activeFrequency) &&
      (selectedLocation === 0 || task.location_id === selectedLocation)
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

  const getLocationName = (locationId) => {
    const location = locations?.find(loc => loc.id === locationId);
    return location?.name || 'Unknown Location';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Welcome, {user?.name || 'User'}
        </h1>

        <QuickStats stats={stats} />

        {/* Status Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500">
            {successMessage}
          </div>
        )}

        {/* Filters Container */}
        <div className="mb-8 space-y-4">
          {/* Filter Dropdowns */}
          <div className="grid grid-cols-2 gap-4">
            <Dropdown 
              options={[{ id: 0, name: 'All Locations' }, ...(locations || [])]} 
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

        {/* Tasks Table */}
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
                  <th className="p-3 cursor-pointer" onClick={() => handleSort('locationName')}>
                    Location
                  </th>
                  <th className="p-3">Frequency</th>
                  <th className="p-3">Last Completed</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => (
                  <tr 
                    key={task.id} 
                    className={`
                      border-b border-slate-800 
                      ${task.is_complete 
                        ? 'bg-green-900/20 hover:bg-green-900/30' 
                        : 'bg-slate-900/50 hover:bg-slate-800/50'
                      } 
                      transition-colors duration-200
                    `}
                  >
                    <td className="p-3">
                      {task.is_complete ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </td>
                    <td className={`p-3 ${task.is_complete ? 'line-through text-slate-500' : 'text-white'}`}>
                      {task.name}
                    </td>
                    <td className="p-3 text-slate-400">
                      {getLocationName(task.location_id)}
                    </td>
                    <td className="p-3 text-slate-400">
                      {FREQUENCIES[task.frequency_id]}
                    </td>
                    <td className="p-3 text-slate-400">
                      {task.last_completed 
                        ? new Date(task.last_completed).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleCompleteToggle(task.id)}
                        className={`
                          p-2 rounded-lg transition-all duration-200 
                          ${task.is_complete 
                            ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                            : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                          }
                        `}
                        title={task.is_complete ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {task.is_complete ? <X className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      </button>
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

export default Dashboard;
