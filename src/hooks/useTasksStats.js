import { useMemo } from 'react';

export const useTasksStats = (tasks) => {
  return useMemo(() => {
    if (!tasks) return {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0
    };

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.is_complete).length;
    const pendingTasks = totalTasks - completedTasks;

    return {
      totalTasks,
      completedTasks,
      pendingTasks
    };
  }, [tasks]);
};