import React from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

const FREQUENCY_NAMES = {
  1: 'Daily',
  2: 'Weekly',
  3: 'Monthly',
  4: 'Quarterly',
  5: 'Yearly'
};

const LOCATION_NAMES = {
  1: 'Kitchen',
  2: 'Bathroom',
  3: 'Living Room',
  4: 'Bedroom',
  5: 'Hallway',
  6: 'Den',
  7: 'House',
  8: 'Yard'
};

const ChoreModal = ({
  isOpen,
  onClose,
  chore,
  onToggleComplete,
  currentDate
}) => {
  if (!isOpen || !chore) return null;

  const frequencyName = FREQUENCY_NAMES[chore.frequency_id] || 'Unknown';
  const locationName = LOCATION_NAMES[chore.location_id] || 'Unknown';
  const formattedDate = currentDate ? format(new Date(currentDate), 'PPP') : 'Not specified';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-md bg-white rounded-lg shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {chore.name}
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              chore.is_complete 
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {chore.is_complete ? 'Completed' : 'Pending'}
            </span>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Frequency</h4>
                <p className="mt-1 text-gray-900">{frequencyName}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Location</h4>
                <p className="mt-1 text-gray-900">{locationName}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500">Due Date</h4>
              <p className="mt-1 text-gray-900">{formattedDate}</p>
            </div>

            {chore.last_completed && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Last Completed</h4>
                <p className="mt-1 text-gray-900">
                  {format(new Date(chore.last_completed), 'PPP')}
                </p>
              </div>
            )}

            {chore.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                  {chore.notes}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => onToggleComplete(chore.id)}
              className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                chore.is_complete
                  ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {chore.is_complete ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ChoreModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onToggleComplete: PropTypes.func.isRequired,
  currentDate: PropTypes.string,
  chore: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    frequency_id: PropTypes.number.isRequired,
    location_id: PropTypes.number.isRequired,
    notes: PropTypes.string,
    is_complete: PropTypes.bool,
    last_completed: PropTypes.string,
  })
};

export default ChoreModal;