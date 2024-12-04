import { useState, useEffect } from 'react';

export const useChoresStats = (chores) => {
  const [stats, setStats] = useState({
    completedToday: 0,
    pendingToday: 0,
    totalToday: 0
  });

  useEffect(() => {
    if (chores) {
      const completed = chores.filter(chore => chore.is_complete).length;
      const total = chores.length;
      const pending = total - completed;
      
      setStats({
        completedToday: completed,
        pendingToday: pending,
        totalToday: total
      });
    }
  }, [chores]);

  return stats;
};

export default useChoresStats;