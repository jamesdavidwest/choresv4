import React, { useEffect } from 'react';
import { useChores } from '../../context/ChoresContext';
import ChoreCalendar from '../../components/calendar/ChoreCalendar';

const CalendarPage = () => {
  const { personalChores, refreshPersonalChores } = useChores();

  useEffect(() => {
    console.log('CalendarPage: Fetching chores');
    refreshPersonalChores();
  }, [refreshPersonalChores]);

  console.log('CalendarPage: Current chores:', personalChores);

  return (
    <div>
      <ChoreCalendar chores={personalChores} />
    </div>
  );
};

export default CalendarPage;