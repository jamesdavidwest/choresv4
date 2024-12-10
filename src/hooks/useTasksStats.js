// src/hooks/useTasksStats.js
import { useMemo } from 'react';

/**
 * Calculate statistics for tasks and their instances
 * @param {Array} tasks - Array of tasks with their instances
 * @param {Object} options - Optional configuration
 * @param {boolean} options.includeInactive - Whether to include inactive tasks
 * @param {Date} options.startDate - Start date for filtering instances
 * @param {Date} options.endDate - End date for filtering instances
 * @returns {Object} Statistics object
 */
export const useTasksStats = (tasks, options = {}) => {
  // Extract options with defaults
  const includeInactive = useMemo(() => options.includeInactive ?? false, [options.includeInactive]);
  const startDate = useMemo(() => options.startDate, [options.startDate]);
  const endDate = useMemo(() => options.endDate, [options.endDate]);

  return useMemo(() => {
    // Default return object for empty/invalid input
    const defaultStats = {
      totalTasks: 0,
      activeTasks: 0,
      inactiveTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      totalInstances: 0,
      completedInstances: 0,
      pendingInstances: 0,
      overdueInstances: 0,
      completionRate: 0,
      onTimeCompletionRate: 0
    };

    // Handle invalid input
    if (!Array.isArray(tasks)) return defaultStats;

    const now = new Date();
    const stats = { ...defaultStats };

    // Filter tasks based on options
    const filteredTasks = tasks.filter(task => 
      includeInactive || task.is_active !== false
    );

    stats.totalTasks = filteredTasks.length;
    stats.activeTasks = filteredTasks.filter(task => task.is_active !== false).length;
    stats.inactiveTasks = stats.totalTasks - stats.activeTasks;

    // Process instances statistics
    let totalValidInstances = 0;
    let onTimeCompletions = 0;

    filteredTasks.forEach(task => {
      // Skip if task doesn't have instances
      if (!Array.isArray(task.instances)) return;

      // Filter instances based on date range if provided
      const relevantInstances = task.instances.filter(instance => {
        if (!instance.due_date) return false;
        
        const instanceDate = new Date(instance.due_date);
        if (startDate && instanceDate < startDate) return false;
        if (endDate && instanceDate > endDate) return false;
        
        return true;
      });

      totalValidInstances += relevantInstances.length;

      relevantInstances.forEach(instance => {
        const dueDate = new Date(instance.due_date);
        const completedAt = instance.completed_at ? new Date(instance.completed_at) : null;
        const isOverdue = !instance.is_complete && dueDate < now;
        const wasCompletedOnTime = instance.is_complete && completedAt <= dueDate;

        if (instance.is_complete) {
          stats.completedInstances++;
          if (wasCompletedOnTime) {
            onTimeCompletions++;
          }
        } else {
          stats.pendingInstances++;
          if (isOverdue) {
            stats.overdueInstances++;
          }
        }
      });
    });

    // Calculate task-level statistics based on instance status
    filteredTasks.forEach(task => {
      const hasIncompleteInstances = task.instances?.some(i => !i.is_complete);
      const hasOverdueInstances = task.instances?.some(i => {
        const dueDate = new Date(i.due_date);
        return !i.is_complete && dueDate < now;
      });

      if (!hasIncompleteInstances) {
        stats.completedTasks++;
      } else {
        stats.pendingTasks++;
        if (hasOverdueInstances) {
          stats.overdueTasks++;
        }
      }
    });

    // Calculate rates
    stats.totalInstances = totalValidInstances;
    stats.completionRate = totalValidInstances > 0
      ? (stats.completedInstances / totalValidInstances) * 100
      : 0;
    stats.onTimeCompletionRate = stats.completedInstances > 0
      ? (onTimeCompletions / stats.completedInstances) * 100
      : 0;

    // Round rates to 2 decimal places
    stats.completionRate = Math.round(stats.completionRate * 100) / 100;
    stats.onTimeCompletionRate = Math.round(stats.onTimeCompletionRate * 100) / 100;

    return stats;
  }, [tasks, includeInactive, startDate, endDate]);
};