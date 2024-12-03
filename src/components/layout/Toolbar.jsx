// src/components/layout/Toolbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { Home, LogOut, Moon, Sun, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';

const Toolbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check user's system preference on initial load
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);
    updateDarkMode(prefersDarkMode);
  }, []);

  useEffect(() => {
    updateDarkMode(isDarkMode);
  }, [isDarkMode]);

  const updateDarkMode = (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <nav className="bg-white dark:bg-dark-900 shadow-sm dark:shadow-dark-md transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and user welcome */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="text-xl font-bold text-gray-800 dark:text-dark-50 hover:text-gray-600 dark:hover:text-dark-200 transition-colors duration-200"
            >
              ChoresApp
            </Link>
            {user && (
              <span className="ml-4 text-gray-600 dark:text-dark-300">
                Welcome, {user.name}
              </span>
            )}
          </div>

          {/* Right side - Navigation icons */}
          <div className="flex items-center space-x-4">
            {user && (
              <>
                {/* Dark Mode Toggle */}
                <button 
                  onClick={toggleDarkMode}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full transition-colors duration-200"
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5 text-gray-600 dark:text-dark-300" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-600 dark:text-dark-300" />
                  )}
                </button>

                <Link 
                  to="/dashboard" 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full transition-colors duration-200"
                  title="Dashboard"
                >
                  <Home className="h-5 w-5 text-gray-600 dark:text-dark-300" />
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

                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full transition-colors duration-200"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5 text-gray-600 dark:text-dark-300" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Toolbar;