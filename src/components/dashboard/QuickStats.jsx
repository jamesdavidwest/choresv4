// src/components/dashboard/QuickStats.jsx
import PropTypes from 'prop-types';
import { Card } from '../ui/card';
import { CheckCircle, Clock, Calendar } from 'lucide-react';

const QuickStats = ({ 
  stats = { 
    completedToday: 0, 
    pendingTasks: 0, 
    nextDue: 'No upcoming tasks' 
  } 
}) => {
  return (
    <Card className="p-4 mb-6">
      <table className="w-full">
        <tbody>
          <tr className="flex items-center space-x-2 mb-2">
            <td className="w-12">
              <CheckCircle className="text-green-500 h-8 w-8" />
            </td>
            <td>
              <h3 className="text-sm font-medium text-gray-500">Completed Today</h3>
              <p className="text-2xl font-bold">{stats.completedToday}</p>
            </td>
          </tr>
          <tr className="flex items-center space-x-2 mb-2">
            <td className="w-12">
              <Clock className="text-yellow-500 h-8 w-8" />
            </td>
            <td>
              <h3 className="text-sm font-medium text-gray-500">Pending Tasks</h3>
              <p className="text-2xl font-bold">{stats.pendingTasks}</p>
            </td>
          </tr>
          <tr className="flex items-center space-x-2">
            <td className="w-12">
              <Calendar className="text-blue-500 h-8 w-8" />
            </td>
            <td>
              <h3 className="text-sm font-medium text-gray-500">Next Due</h3>
              <p className="text-sm">{stats.nextDue}</p>
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
};

QuickStats.propTypes = {
  stats: PropTypes.shape({
    completedToday: PropTypes.number,
    pendingTasks: PropTypes.number,
    nextDue: PropTypes.string
  })
};

export default QuickStats;
