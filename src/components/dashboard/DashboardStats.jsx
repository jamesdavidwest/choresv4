import PropTypes from 'prop-types';
import { CheckCircle, Clock, ListTodo } from 'lucide-react';

const DashboardStats = ({ stats }) => {
  return (
    <div className="flex justify-between gap-6 mb-8">
      <div className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center">
        <div className="flex flex-col items-center">
          <div className="p-3 bg-green-500/10 rounded-xl mb-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Completed Today</p>
          <h3 className="text-3xl font-bold text-white">{stats.completedToday}</h3>
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center">
        <div className="flex flex-col items-center">
          <div className="p-3 bg-amber-500/10 rounded-xl mb-2">
            <Clock className="h-6 w-6 text-amber-500" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Pending Today</p>
          <h3 className="text-3xl font-bold text-white">{stats.pendingToday}</h3>
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center">
        <div className="flex flex-col items-center">
          <div className="p-3 bg-blue-500/10 rounded-xl mb-2">
            <ListTodo className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Total Today</p>
          <h3 className="text-3xl font-bold text-white">{stats.totalToday}</h3>
        </div>
      </div>
    </div>
  );
};

DashboardStats.propTypes = {
  stats: PropTypes.shape({
    completedToday: PropTypes.number.isRequired,
    pendingToday: PropTypes.number.isRequired,
    totalToday: PropTypes.number.isRequired
  }).isRequired
};

export default DashboardStats;