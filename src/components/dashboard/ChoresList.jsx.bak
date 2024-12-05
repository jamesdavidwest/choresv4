import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '../ui/card';

const ChoresList = ({ 
  chores = [], 
  locations = [], 
  onToggleComplete, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!chores?.length) {
    return (
      <Card className="p-4 bg-gray-800">
        <p className="text-center text-gray-400">No chores assigned.</p>
      </Card>
    );
  }

  const getLocationName = (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    return location?.name || 'Unknown Location';
  };

  return (
    <div className="space-y-4">
      {chores.map((chore) => (
        <Card key={chore.id} className="p-4 bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{chore.name}</h3>
              <p className="text-sm text-gray-400">{getLocationName(chore.location_id)}</p>
            </div>
            <button
              onClick={() => onToggleComplete(chore.id)}
              className={`px-4 py-2 rounded ${
                chore.is_complete
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {chore.is_complete ? 'Completed' : 'Mark Complete'}
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
};

ChoresList.propTypes = {
  chores: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      location_id: PropTypes.number.isRequired,
      is_complete: PropTypes.bool
    })
  ),
  locations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  onToggleComplete: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

export default ChoresList;