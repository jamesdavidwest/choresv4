import { useState, useEffect } from 'react';
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

const DEFAULT_TIME = '21:00'; // 9:00 PM

const defaultChore = {
  name: '',
  frequency_id: 1,
  location_id: 1,
  notes: '',
  is_complete: false,
  due_date: format(new Date(), 'yyyy-MM-dd'),
  due_time: DEFAULT_TIME
};

const ChoreModal = ({
  isOpen,
  onClose,
  chore,
  onToggleComplete,
  onSave,
  currentDate,
  mode = 'view'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(defaultChore);

  useEffect(() => {
    if (mode === 'view' && chore) {
      setFormData(chore);
    } else if (mode === 'create') {
      setFormData({ 
        ...defaultChore, 
        due_date: currentDate || format(new Date(), 'yyyy-MM-dd')
      });
    }
  }, [mode, chore, currentDate]);

  if (!isOpen) return null;
  if (mode === 'view' && !chore) return null;

  const formattedDate = currentDate ? format(new Date(currentDate), 'PPP') : 'Not specified';

  const handleToggle = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await onToggleComplete(chore.id);
    } catch (error) {
      console.error('Failed to toggle chore:', error);
      setError(error.message || 'Failed to update chore status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setIsLoading(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save chore:', error);
      setError(error.message || 'Failed to save chore');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'frequency_id' || name === 'location_id' ? parseInt(value, 10) : value
    }));
  };

  const handleClose = () => {
    setError(null);
    if (mode === 'create') {
      setFormData(defaultChore);
    }
    onClose();
  };

  const renderViewMode = () => (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">
          {chore.name}
        </h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          chore.is_complete 
            ? 'bg-green-500/20 text-green-400'
            : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {chore.is_complete ? 'Completed' : 'Pending'}
        </span>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-400">Frequency</h4>
            <p className="mt-1 text-white">{FREQUENCY_NAMES[chore.frequency_id] || 'Unknown'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-400">Location</h4>
            <p className="mt-1 text-white">{LOCATION_NAMES[chore.location_id] || 'Unknown'}</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-400">Due Date</h4>
          <p className="mt-1 text-white">{formattedDate}</p>
        </div>

        {chore.due_time && (
          <div>
            <h4 className="text-sm font-medium text-gray-400">Due Time</h4>
            <p className="mt-1 text-white">
              {format(new Date(`2000-01-01T${chore.due_time}`), 'h:mm a')}
            </p>
          </div>
        )}

        {chore.last_completed && (
          <div>
            <h4 className="text-sm font-medium text-gray-400">Last Completed</h4>
            <p className="mt-1 text-white">
              {format(new Date(chore.last_completed), 'PPP')}
            </p>
          </div>
        )}

        {chore.notes && (
          <div>
            <h4 className="text-sm font-medium text-gray-400">Notes</h4>
            <p className="mt-1 text-sm text-gray-300 whitespace-pre-wrap">
              {chore.notes}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Close
        </button>
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            chore.is_complete
              ? 'bg-red-900/60 text-red-300 hover:bg-red-900/80 focus:ring-red-700'
              : 'bg-blue-900/60 text-blue-300 hover:bg-blue-900/80 focus:ring-blue-700'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{chore.is_complete ? 'Marking incomplete...' : 'Marking complete...'}</span>
            </span>
          ) : (
            <span>{chore.is_complete ? 'Mark Incomplete' : 'Mark Complete'}</span>
          )}
        </button>
      </div>
    </>
  );

  const renderCreateMode = () => (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">
          Create New Chore
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400">
            Name
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">
              Frequency
              <select
                name="frequency_id"
                value={formData.frequency_id}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {Object.entries(FREQUENCY_NAMES).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">
              Location
              <select
                name="location_id"
                value={formData.location_id}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {Object.entries(LOCATION_NAMES).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">
              Due Date
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">
              Due Time
              <input
                type="time"
                name="due_time"
                value={formData.due_time}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400">
            Notes
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-900/60 text-blue-300 rounded-md hover:bg-blue-900/80 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Creating...</span>
            </span>
          ) : (
            'Create Chore'
          )}
        </button>
      </div>
    </form>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/70 transition-opacity"
        onClick={handleClose}
      />
      <div className="relative z-50 w-full max-w-md bg-gray-900 rounded-lg shadow-xl">
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 text-red-400 rounded">
              {error}
            </div>
          )}
          {mode === 'view' ? renderViewMode() : renderCreateMode()}
        </div>
      </div>
    </div>
  );
};

ChoreModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  chore: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    frequency_id: PropTypes.number.isRequired,
    location_id: PropTypes.number.isRequired,
    notes: PropTypes.string,
    is_complete: PropTypes.bool.isRequired,
    due_date: PropTypes.string.isRequired,
    due_time: PropTypes.string.isRequired,
    last_completed: PropTypes.string
  }),
  onToggleComplete: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  currentDate: PropTypes.string,
  mode: PropTypes.oneOf(['view', 'create'])
};

export default ChoreModal;
