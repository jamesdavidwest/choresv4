import PropTypes from 'prop-types';
import { useState } from 'react';
import ChoresTableHeader from './ChoresTableHeader';
import ChoresTableRow from './ChoresTableRow';

const ChoresTable = ({ chores, locations, onToggleComplete, isLoading }) => {
  const [activeFrequency, setActiveFrequency] = useState('1'); // Changed default to '1' for Daily
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
    .filter(chore => activeFrequency === '0' || chore.frequency_id.toString() === activeFrequency)
    .sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800/50">
      {/* Frequency Filter */}
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <ChoresTableHeader 
              onSort={handleSort}
              sortConfig={sortConfig}
            />
          </thead>
          <tbody>
            {sortedChores.map(chore => (
              <ChoresTableRow 
                key={chore.id}
                chore={chore}
                onToggleComplete={onToggleComplete}
                getLocationName={getLocationName}
                frequencyTypes={frequencyTypes}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

ChoresTable.propTypes = {
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
  onToggleComplete: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired
};

export default ChoresTable;