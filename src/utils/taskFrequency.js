// Utility for managing task frequencies

export const calculateNextOccurrence = (task) => {
  const now = new Date();
  const createdDate = new Date(task.createdAt);

  switch (task.frequency) {
    case 'Daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    
    case 'Weekly': {
      const nextSaturday = new Date(now);
      nextSaturday.setDate(now.getDate() + (6 - now.getDay() + 7) % 7);
      return new Date(nextSaturday.getFullYear(), nextSaturday.getMonth(), nextSaturday.getDate(), 12, 0, 0);
    }
    
    case 'Monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0);
    
    case 'Quarterly': {
      const quarterMonths = [2, 5, 8, 11]; // March, June, September, December
      const currentQuarterMonth = quarterMonths.find(month => month > now.getMonth()) || quarterMonths[0];
      const nextQuarterDate = new Date(now.getFullYear(), currentQuarterMonth, 0, 12, 0, 0);
      return nextQuarterDate;
    }
    
    case 'Yearly': {
      // If a specific date is set, use that. Otherwise, use the original creation date
      if (task.specificYearlyDate) {
        const specificDate = new Date(now.getFullYear(), task.specificYearlyDate.month, task.specificYearlyDate.day, 12, 0, 0);
        return specificDate;
      }
      return new Date(now.getFullYear(), createdDate.getMonth(), createdDate.getDate(), 12, 0, 0);
    }
    
    default:
      return null;
  }
};

export const isTaskDue = (task) => {
  const now = new Date();
  const nextOccurrence = calculateNextOccurrence(task);
  
  // Task is due if the next occurrence is today or in the past
  return nextOccurrence <= now;
};

export const formatFrequencyDescription = (task) => {
  switch (task.frequency) {
    case 'Daily':
      return 'Due every day at 12 PM';
    case 'Weekly':
      return 'Due every Saturday at 12 PM';
    case 'Monthly':
      return 'Due on the 1st of every month at 12 PM';
    case 'Quarterly':
      return 'Due on the last day of March, June, September, and December at 12 PM';
    case 'Yearly': {
      if (task.specificYearlyDate) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `Due annually on ${monthNames[task.specificYearlyDate.month]} ${task.specificYearlyDate.day} at 12 PM`;
      }
      return 'Due annually on the day the task was created at 12 PM';
    }
    default:
      return 'Frequency not specified';
  }
};