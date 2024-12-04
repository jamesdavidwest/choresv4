import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { locations as locationsApi } from '../../services/api';
import { useChores } from '../../context/ChoresContext';
import { useChoresStats } from '../../hooks/useChoresStats';
import DashboardStats from './DashboardStats';
import ChoresTable from './ChoresTable';

const Dashboard = () => {
  const { user } = useAuth();
  const { chores, loading: isLoadingChores, error: choresError, toggleChoreComplete } = useChores();
  const { data: locations, loading: isLoadingLocations } = useApi(locationsApi.getAll);
  const stats = useChoresStats(chores);

  if (choresError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-red-500">
            Error loading chores: {choresError.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Welcome, {user?.name || 'User'}
        </h1>
        <DashboardStats stats={stats} />
        <ChoresTable 
          chores={chores || []}
          locations={locations || []}
          onToggleComplete={toggleChoreComplete}
          isLoading={isLoadingChores || isLoadingLocations}
        />
      </div>
    </div>
  );
};

export default Dashboard;