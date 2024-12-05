import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '../ui/card';

const QuickStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="p-4 bg-gray-800">
        <h3 className="text-lg font-semibold mb-2">Total Chores</h3>
        <p className="text-2xl">{stats?.totalChores || 0}</p>
      </Card>
      
      <Card className="p-4 bg-gray-800">
        <h3 className="text-lg font-semibold mb-2">Completed</h3>
        <p className="text-2xl">{stats?.completedChores || 0}</p>
      </Card>
      
      <Card className="p-4 bg-gray-800">
        <h3 className="text-lg font-semibold mb-2">Pending</h3>
        <p className="text-2xl">{stats?.pendingChores || 0}</p>
      </Card>
    </div>
  );
};

QuickStats.propTypes = {
  stats: PropTypes.shape({
    totalChores: PropTypes.number,
    completedChores: PropTypes.number,
    pendingChores: PropTypes.number
  })
};

export default QuickStats;