import PropTypes from 'prop-types';
import { Card } from '../ui/card';
import { CheckCircle } from 'lucide-react';

const ChoreItem = ({ chore, onToggleComplete, locationName }) => {
  return (
    <Card className="p-4 mb-2 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onToggleComplete(chore.id.toString())}
            className={`p-1 rounded-full transition-colors ${
              chore.is_complete ? 'text-green-500' : 'text-gray-300'
            }`}
          >
            <CheckCircle className="h-6 w-6" />
          </button>
          <div>
            <h4 className={`font-medium ${chore.is_complete ? 'line-through text-gray-400' : ''}`}>
              {chore.name}
            </h4>
            <p className="text-sm text-gray-500">{locationName}</p>
          </div>
        </div>
        <span className="text-sm text-gray-500">
          {chore.last_completed 
            ? new Date(chore.last_completed).toLocaleDateString() 
            : 'Not completed'}
        </span>
      </div>
    </Card>
  );
};

ChoreItem.propTypes = {
  chore: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    is_complete: PropTypes.bool.isRequired,
    last_completed: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  }).isRequired,
  onToggleComplete: PropTypes.func.isRequired,
  locationName: PropTypes.string
};

ChoreItem.defaultProps = {
  locationName: 'No location specified'
};

export default ChoreItem;
