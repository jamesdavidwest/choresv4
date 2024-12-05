// src/components/layout/Toolbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { Home, LogOut, ClipboardList, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';

const Toolbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Always set dark mode as default
    updateDarkMode();

    // Set up interval to update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Clean up interval on component unmount
    return () => clearInterval(timeInterval);
  }, []);

  const updateDarkMode = () => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Format time in Central Standard Time
  const formattedTime = currentTime.toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <nav className="bg-white dark:bg-dark-900 shadow-sm dark:shadow-dark-md transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Navigation icons */}
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <Link 
                  to="/dashboard" 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full transition-colors duration-200"
                  title="Dashboard"
                >
                  <Home className="h-5 w-5 text-gray-600 dark:text-dark-300" />
                </Link>

                {/* Calendar Link - Available to all users */}
                <Link 
                  to="/calendar" 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full transition-colors duration-200"
                  title="Calendar"
                >
                  <Calendar className="h-5 w-5 text-gray-600 dark:text-dark-300" />
                </Link>

                {/* Admin/Manager Chores Management Link */}
                {isAdminOrManager && (
                  <Link 
                    to="/chores" 
                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full transition-colors duration-200"
                    title="Manage Chores"
                  >
                    <ClipboardList className="h-5 w-5 text-gray-600 dark:text-dark-300" />
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Centered content - Logo, Welcome, and Time */}
          <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
            <div className="flex flex-col items-center">
              <Link 
                to="/" 
                className="text-xl font-bold text-gray-800 dark:text-dark-50 hover:text-gray-600 dark:hover:text-dark-200 transition-colors duration-200"
              >
                ChoresApp
              </Link>
              {user && (
                <div className="text-gray-600 dark:text-dark-300 text-sm">
                  <span>Welcome, {user.name}</span>
                  <span className="ml-2 text-gray-500 dark:text-dark-300">
                    {formattedTime}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Logout */}
          <div className="flex items-center">
            {user && (
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full transition-colors duration-200"
                title="Logout"
              >
                <LogOut className="h-5 w-5 text-gray-600 dark:text-dark-300" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Toolbar;