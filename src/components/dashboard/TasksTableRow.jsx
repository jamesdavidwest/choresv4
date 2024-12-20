import PropTypes from 'prop-types';
import { CheckCircle, X, CheckCircle2 } from 'lucide-react';

const TasksTableRow = ({ task, onToggleComplete, getLocationName, frequencyTypes }) => {
  return (
    <tr 
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
        {frequencyTypes[task.frequency_id]}
      </td>
      <td className="p-3 text-slate-400">
        {task.last_completed 
          ? new Date(task.last_completed).toLocaleDateString() 
          : 'Never'}
      </td>
      <td className="p-3">
        <button
          onClick={() => onToggleComplete(task.id)}
          className={`
            p-2 rounded-lg transition-all duration-200 
            ${task.is_complete 
              ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
              : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
            }
          `}
        >
          {task.is_complete ? <X className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        </button>
      </td>
    </tr>
  );
};

TasksTableRow.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    frequency_id: PropTypes.number.isRequired,
    location_id: PropTypes.number.isRequired,
    is_complete: PropTypes.bool,
    last_completed: PropTypes.string
  }).isRequired,
  onToggleComplete: PropTypes.func.isRequired,
  getLocationName: PropTypes.func.isRequired,
  frequencyTypes: PropTypes.object.isRequired
};

export default TasksTableRow;
