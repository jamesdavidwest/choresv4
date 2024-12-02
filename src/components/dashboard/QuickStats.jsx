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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <CheckCircle className="text-green-500 h-8 w-8" />
          <div>
            <h3 className="text-sm font-medium text-gray-500">Completed Today</h3>
            <p className="text-2xl font-bold">{stats.completedToday}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <Clock className="text-yellow-500 h-8 w-8" />
          <div>
            <h3 className="text-sm font-medium text-gray-500">Pending Tasks</h3>
            <p className="text-2xl font-bold">{stats.pendingTasks}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <Calendar className="text-blue-500 h-8 w-8" />
          <div>
            <h3 className="text-sm font-medium text-gray-500">Next Due</h3>
            <p className="text-sm">{stats.nextDue}</p>
          </div>
        </div>
      </Card>
    </div>
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
