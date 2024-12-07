import { useEffect } from 'react';
import { useChores } from '../../context/ChoresContext';
import { useAuth } from '../../context/AuthContext';
import ChoreCalendar from '../../components/calendar/ChoreCalendar';

const CalendarPage = () => {
  const { personalChores, allChores, refreshPersonalChores, refreshAllChores } = useChores();
  const { user } = useAuth();

  useEffect(() => {
    console.log('CalendarPage: Fetching chores');
    refreshPersonalChores();
    if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
      refreshAllChores();
    }
  }, [refreshPersonalChores, refreshAllChores, user?.role]);

  console.log('CalendarPage: Current user:', user);
  console.log('CalendarPage: All chores:', allChores);
  console.log('CalendarPage: Personal chores:', personalChores);

  // Wait for user to be available
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Use allChores for admin/manager, personalChores for regular users
  const displayChores = (user.role === 'ADMIN' || user.role === 'MANAGER') 
    ? allChores 
    : personalChores;

  return (
    <div>
      <ChoreCalendar 
        chores={displayChores} 
        currentUser={user}
      />
    </div>
  );
};

export default CalendarPage;