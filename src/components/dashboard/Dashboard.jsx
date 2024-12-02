// src/components/dashboard/Dashboard.jsx
import { useState, useEffect } from 'react';
import QuickStats from './QuickStats';
import ChoresList from './ChoresList';
import database from '../../data/database.json';

const Dashboard = () => {
  const [chores, setChores] = useState([]);
  const [locations, setLocations] = useState([]);
  const [stats, setStats] = useState({
    completedToday: 0,
    pendingTasks: 0,
    nextDue: 'No upcoming tasks'
  });

  // Simulating a user ID (would come from auth in real app)
  const currentUserId = 4; // Sadie's ID from the database

  useEffect(() => {
    // Load chores and locations from database
    const userChores = database.chores.filter(chore => 
      chore.assigned_to === currentUserId
    );
    setChores(userChores.map(chore => ({ ...chore, is_complete: false })));
    setLocations(database.locations);

    // Calculate initial stats
    updateStats(userChores);
  }, []);

  const updateStats = (choresList) => {
    const completed = choresList.filter(chore => chore.is_complete).length;
    const pending = choresList.length - completed;
    
    setStats({
      completedToday: completed,
      pendingTasks: pending,
      nextDue: pending > 0 ? 'Today' : 'No upcoming tasks'
    });
  };

  const handleToggleComplete = (choreId) => {
    setChores(prevChores => {
      const updatedChores = prevChores.map(chore =>
        chore.id === choreId
          ? { ...chore, 
              is_complete: !chore.is_complete,
              last_completed: !chore.is_complete ? new Date().toISOString() : null
            }
          : chore
      );
      updateStats(updatedChores);
      return updatedChores;
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Dashboard</h1>
      <QuickStats stats={stats} />
      <ChoresList 
        chores={chores}
        locations={locations}
        onToggleComplete={handleToggleComplete}
      />
    </div>
  );
};

export default Dashboard;