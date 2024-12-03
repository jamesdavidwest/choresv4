// src/components/chores/AdminChoresList.jsx
import PropTypes from 'prop-types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const AdminChoresList = ({ chores, locations, users, onDelete }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('1');
  
  const frequencyTypes = {
    1: 'Daily',
    2: 'Weekly',
    3: 'Monthly',
    4: 'Quarterly',
    5: 'Yearly'
  };

  const getLocationName = (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown Location';
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unassigned';
  };

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Chores</h2>
        <button
          onClick={() => navigate('/chores/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Chore
        </button>
      </div>

      {/* Frequency Tabs */}
      <div className="w-full">
        <div className="grid grid-cols-5 gap-2 mb-6">
          {Object.entries(frequencyTypes).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`py-2 px-4 text-center rounded-md transition-colors ${
                activeTab === id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {chores
            .filter(chore => chore.frequency_id === parseInt(activeTab))
            .map(chore => (
              <div
                key={chore.id}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-4 gap-4 flex-1">
                    <div>
                      <h4 className="font-medium">{chore.name}</h4>
                      <p className="text-sm text-gray-600">
                        {getLocationName(chore.location_id)}
                      </p>
                    </div>
                    <div className="text-sm">
                      Assigned to: {getUserName(chore.assigned_to)}
                    </div>
                    <div className="text-sm">
                      Status: {chore.is_complete ? 'Completed' : 'Pending'}
                    </div>
                    <div className="text-sm">
                      Last completed: {chore.last_completed ? 
                        new Date(chore.last_completed).toLocaleDateString() : 
                        'Never'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/chores/${chore.id}/edit`)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Edit className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => onDelete(chore.id)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

AdminChoresList.propTypes = {
  chores: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    frequency_id: PropTypes.number.isRequired,
    location_id: PropTypes.number.isRequired,
    assigned_to: PropTypes.number.isRequired,
    is_complete: PropTypes.bool,
    last_completed: PropTypes.string
  })).isRequired,
  locations: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  users: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  onDelete: PropTypes.func.isRequired
};

export default AdminChoresList;