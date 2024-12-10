import { useState } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Dropdown } from '../ui/dropdown';
import database from '../../data/database.json';

const FREQUENCIES = {
  0: 'All Frequencies',
  1: 'Daily',
  2: 'Weekly', 
  3: 'Monthly',
  4: 'Quarterly',
  5: 'Yearly',
  6: 'Once'
};

const AdminTasksList = ({ tasks, onDelete, onUpdateTask }) => {
  const { user } = useAuth();
  const [activeFrequency, setActiveFrequency] = useState(0);
  const [selectedUser, setSelectedUser] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // Prepare dropdown options
  const userOptions = [
    { id: 0, name: 'All Users' },
    ...database.users.map(u => ({ id: u.id, name: u.name }))
  ];

  const locationOptions = [
    { id: 0, name: 'All Locations' },
    ...database.locations.map(l => ({ id: l.id, name: l.name }))
  ];

  const frequencyOptions = Object.entries(FREQUENCIES).map(([id, name]) => ({
    id: parseInt(id),
    name
  }));

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filtering and sorting logic
  const filteredAndSortedTasks = [...tasks]
    .filter(task => 
      (activeFrequency === 0 || task.frequency_id === activeFrequency) &&
      (selectedUser === 0 || task.assigned_to === selectedUser) &&
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

  const handleCompleteToggle = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      onUpdateTask(taskId, { is_complete: !task.is_complete });
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(taskId);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Dropdown 
            options={userOptions} 
            selectedValue={selectedUser} 
            onSelect={setSelectedUser} 
            placeholder="Select User"
          />
          <Dropdown 
            options={locationOptions} 
            selectedValue={selectedLocation} 
            onSelect={setSelectedLocation} 
            placeholder="Select Location"
          />
          <Dropdown 
            options={frequencyOptions} 
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
                <th className="p-3 cursor-pointer" onClick={() => handleSort('assignedUserName')}>
                  Assigned To
                </th>
                <th className="p-3 cursor-pointer" onClick={() => handleSort('locationName')}>
                  Location
                </th>
                <th className="p-3">
                  Frequency
                </th>
                <th className="p-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTasks.map(task => (
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
                    {task.assignedUserName}
                  </td>
                  <td className="p-3 text-slate-400">
                    {task.locationName}
                  </td>
                  <td className="p-3 text-slate-400">
                    {FREQUENCIES[task.frequency_id]}
                  </td>
                  <td className="p-3 space-x-2">
                    {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
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
                    )}
                    {user?.role === 'ADMIN' && (
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30"
                        title="Delete task"
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
  );
};

AdminTasksList.propTypes = {
  tasks: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    frequency_id: PropTypes.number.isRequired,
    location_id: PropTypes.number.isRequired,
    assigned_to: PropTypes.number.isRequired,
    is_complete: PropTypes.bool,
    assignedUserName: PropTypes.string,
    locationName: PropTypes.string
  })).isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpdateTask: PropTypes.func.isRequired
};

export default AdminTasksList;
