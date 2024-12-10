import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { FREQUENCY_NAMES, LOCATION_NAMES, USERS, DEFAULT_TIME } from '../../constants/taskConstants';

const defaultTask = {
  name: '',
  frequency_id: 1,
  location_id: 1,
  notes: '',
  is_complete: false,
  start_date: format(new Date(), 'yyyy-MM-dd'),
  end_date: format(new Date(), 'yyyy-MM-dd'),
  due_time: DEFAULT_TIME,
};

const getStatusDisplay = (status, isComplete, isSkipped) => {
  if (isSkipped) return { text: 'Skipped', classes: 'bg-gray-500/20 text-gray-400' };
  if (isComplete) return { text: 'Completed', classes: 'bg-green-500/20 text-green-400' };
  
  switch (status) {
    case 'overdue':
      return { text: 'Overdue', classes: 'bg-red-500/20 text-red-400' };
    case 'pending':
      return { text: 'Pending', classes: 'bg-yellow-500/20 text-yellow-400' };
    case 'active':
      return { text: 'Active', classes: 'bg-blue-500/20 text-blue-400' };
    default:
      return { text: 'Unknown', classes: 'bg-gray-500/20 text-gray-400' };
  }
};

const TaskModal = ({
  isOpen,
  onClose,
  task,
  onToggleComplete,
  onSave,
  currentDate,
  mode = 'view',
  selectedInstance = null,
  selectedUserId,
  onDelete,
  user
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasEndDateBeenSet, setHasEndDateBeenSet] = useState(false);
  const [formData, setFormData] = useState(() => {
    if (mode === 'view' && task) {
      return task;
    }
    return {
      ...defaultTask,
      start_date: currentDate || format(new Date(), 'yyyy-MM-dd'),
      end_date: currentDate || format(new Date(), 'yyyy-MM-dd'),
      assigned_to: selectedUserId
    };
  });
  
  // Track completion state separately
  const [isComplete, setIsComplete] = useState(
    selectedInstance ? selectedInstance.is_complete : task?.is_complete || false
  );

  useEffect(() => {
    if (!isOpen) return;
    
    if (mode === 'view' && task) {
      setFormData(task);
      setIsComplete(selectedInstance ? selectedInstance.is_complete : task.is_complete);
    } else if (mode === 'create') {
      setFormData({
        ...defaultTask,
        start_date: currentDate || format(new Date(), 'yyyy-MM-dd'),
        end_date: currentDate || format(new Date(), 'yyyy-MM-dd'),
        assigned_to: selectedUserId
      });
      setIsComplete(false);
    }
    setHasEndDateBeenSet(false);
  }, [isOpen, mode, task, currentDate, selectedUserId, selectedInstance]);

  useEffect(() => {
    if (mode === 'create' && !hasEndDateBeenSet) {
      setFormData(prev => ({
        ...prev,
        end_date: prev.start_date
      }));
    }
  }, [formData.start_date, mode, hasEndDateBeenSet]);

  if (!isOpen) return null;
  if (mode === 'view' && !task) return null;

  const handleToggle = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await onToggleComplete(task.id, selectedInstance?.id);
      setIsComplete(!isComplete);
      onClose();
    } catch (error) {
      console.error('Failed to toggle task:', error);
      setError(error.message || 'Failed to update task status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setIsLoading(true);

      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate < startDate) {
        throw new Error('End date cannot be before start date');
      }

      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      setError(error.message || 'Failed to save task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'end_date') {
      setHasEndDateBeenSet(true);
    }
    setFormData(prev => ({
      ...prev,
      [name]: ['frequency_id', 'location_id', 'assigned_to'].includes(name) ? parseInt(value, 10) : value
    }));
  };

  const handleClose = () => {
    setError(null);
    setHasEndDateBeenSet(false);
    if (mode === 'create') {
      setFormData(defaultTask);
    }
    onClose();
  };

  const renderModifiedHistory = () => {
    if (!selectedInstance?.modified_history) return null;
    
    let history;
    try {
      history = JSON.parse(selectedInstance.modified_history);
    } catch (e) {
      return null;
    }

    if (!Array.isArray(history) || history.length === 0) return null;

    return (
      <div className="mt-4 border-t border-gray-800 pt-4">
        <h4 className="text-sm font-medium text-gray-400 mb-2">Modification History</h4>
        <div className="space-y-2">
          {history.map((entry, index) => (
            <div key={index} className="text-sm text-gray-300">
              <span className="text-gray-400">{format(new Date(entry.timestamp), 'PPP p')}</span>
              <span className="mx-2">-</span>
              <span>{entry.action}</span>
              {entry.by && (
                <span className="text-gray-400 ml-1">
                  by {USERS[entry.by]?.name || `User ${entry.by}`}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderViewMode = () => {
    const completedAt = selectedInstance ? selectedInstance.completed_at : formData.last_completed;
    const completedBy = selectedInstance ? selectedInstance.completed_by : null;
    const status = selectedInstance?.status || (isComplete ? 'completed' : 'active');
    const statusDisplay = getStatusDisplay(
      status,
      isComplete,
      selectedInstance?.skipped
    );

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">
            {formData.name}
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.classes}`}>
            {statusDisplay.text}
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-400">Frequency</h4>
              <p className="mt-1 text-white">{FREQUENCY_NAMES[formData.frequency_id] || 'Unknown'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-400">Location</h4>
              <p className="mt-1 text-white">{LOCATION_NAMES[formData.location_id] || 'Unknown'}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-400">Assigned To</h4>
            <p className="mt-1 text-white">
              {USERS[formData.assigned_to]?.name || 'Unassigned'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-400">Start Date</h4>
              <p className="mt-1 text-white">
                {formData.start_date ? format(new Date(formData.start_date), 'PPP') : 'Not specified'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-400">End Date</h4>
              <p className="mt-1 text-white">
                {formData.end_date ? format(new Date(formData.end_date), 'PPP') : 'Not specified'}
              </p>
            </div>
          </div>

          {formData.due_time && (
            <div>
              <h4 className="text-sm font-medium text-gray-400">Due Time</h4>
              <p className="mt-1 text-white">
                {format(new Date(`2000-01-01T${formData.due_time}`), 'h:mm a')}
              </p>
            </div>
          )}

          {completedAt && (
            <div>
              <h4 className="text-sm font-medium text-gray-400">
                {selectedInstance ? "Completed On" : "Last Completed"}
              </h4>
              <p className="mt-1 text-white">
                {format(new Date(completedAt), 'PPP')}
                {completedBy && (
                  <span className="text-gray-400 text-sm ml-2">
                    by {USERS[completedBy]?.name || `User ${completedBy}`}
                  </span>
                )}
              </p>
            </div>
          )}

          {formData.notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-400">Notes</h4>
              <p className="mt-1 text-sm text-gray-300 whitespace-pre-wrap">
                {formData.notes}
              </p>
            </div>
          )}

          {renderModifiedHistory()}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          {['ADMIN', 'MANAGER'].includes(user?.role) && (
            <button
              onClick={onDelete}
              disabled={isLoading}
              className="px-4 py-2 bg-red-800/60 text-red-300 rounded-md hover:bg-red-800/80 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Task
            </button>
          )}
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>
          {!selectedInstance?.skipped && (
            <button
              onClick={handleToggle}
              disabled={isLoading}
              className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isComplete
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
                  <span>{isComplete ? 'Marking incomplete...' : 'Marking complete...'}</span>
                </span>
              ) : (
                <span>{isComplete ? 'Mark Incomplete' : 'Mark Complete'}</span>
              )}
            </button>
          )}
        </div>
      </>
    );
  };

  const renderCreateMode = () => (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">
          Create New Task
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

        <div>
          <label className="block text-sm font-medium text-gray-400">
            Assigned To
            <select
              name="assigned_to"
              value={formData.assigned_to || ''}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select User</option>
              {Object.entries(USERS).map(([id, user]) => (
                <option key={id} value={id}>{user.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">
              Start Date
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">
              End Date
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>
          </div>
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

      {error && (
        <div className="mt-4 p-3 bg-red-900/40 border border-red-500/50 text-red-400 rounded">
          {error}
        </div>
      )}

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
            'Create Task'
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
          {mode === 'view' ? renderViewMode() : renderCreateMode()}
        </div>
      </div>
    </div>
  );
};

TaskModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  task: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    frequency_id: PropTypes.number.isRequired,
    location_id: PropTypes.number.isRequired,
    notes: PropTypes.string,
    is_complete: PropTypes.bool,
    start_date: PropTypes.string,
    end_date: PropTypes.string,
    due_time: PropTypes.string,
    last_completed: PropTypes.string,
    assigned_to: PropTypes.number
  }),
  onToggleComplete: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  currentDate: PropTypes.string,
  mode: PropTypes.oneOf(['view', 'create']),
  selectedInstance: PropTypes.shape({
    id: PropTypes.number.isRequired,
    task_id: PropTypes.number.isRequired,
    due_date: PropTypes.string.isRequired,
    is_complete: PropTypes.bool.isRequired,
    completed_at: PropTypes.string,
    completed_by: PropTypes.number,
    status: PropTypes.string,
    skipped: PropTypes.bool,
    modified_history: PropTypes.string,
    start_date: PropTypes.string,
    end_date: PropTypes.string
  }),
  selectedUserId: PropTypes.number,
  onDelete: PropTypes.func.isRequired,
  user: PropTypes.shape({
    id: PropTypes.number,
    role: PropTypes.string,
    name: PropTypes.string
  }).isRequired
};

export default TaskModal;
