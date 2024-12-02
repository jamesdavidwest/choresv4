// src/components/layout/Toolbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { Home, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Toolbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and user welcome */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="text-xl font-bold text-gray-800 hover:text-gray-600"
            >
              ChoresApp
            </Link>
            {user && (
              <span className="ml-4 text-gray-600">
                Welcome, {user.name}
              </span>
            )}
          </div>

          {/* Right side - Navigation icons */}
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <Link 
                  to="/dashboard" 
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  title="Dashboard"
                >
                  <Home className="h-5 w-5 text-gray-600" />
                </Link>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5 text-gray-600" />
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