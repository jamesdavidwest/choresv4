// src/components/dashboard/ChoresList.jsx
import PropTypes from 'prop-types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import ChoreItem from './ChoreItem';

const ChoresList = ({ chores, locations, onToggleComplete }) => {
  // Define frequency types mapping
  const frequencyTypes = {
    1: 'Daily',
    2: 'Weekly',
    3: 'Monthly',
    4: 'Quarterly',
    5: 'Yearly'
  };

  // Helper function to get location name
  const getLocationName = (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown Location';
  };

  return (
    <Tabs defaultValue="1" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        {Object.entries(frequencyTypes).map(([id, label]) => (
          <TabsTrigger key={id} value={id}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      {Object.keys(frequencyTypes).map((frequencyId) => (
        <TabsContent key={frequencyId} value={frequencyId}>
          <div className="space-y-2">
            {chores
              .filter(chore => chore.frequency_id === parseInt(frequencyId))
              .map(chore => (
                <ChoreItem
                  key={chore.id}
                  chore={chore}
                  locationName={getLocationName(chore.location_id)}
                  onToggleComplete={onToggleComplete}
                />
              ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

ChoresList.propTypes = {
  chores: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    frequency_id: PropTypes.number.isRequired,
    location_id: PropTypes.number.isRequired
  })).isRequired,
  locations: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  onToggleComplete: PropTypes.func.isRequired
};

export default ChoresList;
