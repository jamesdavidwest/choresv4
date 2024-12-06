import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import vacuumKidImage from '../assets/boywithabroom.png';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 to-dark-950">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold text-dark-50 mb-6">
            Welcome to <span className="text-blue-400">ChoresApp</span>
          </h1>
          <p className="text-xl text-dark-200 mb-8 max-w-2xl mx-auto">
            Streamline your household management with our intuitive chore tracking system.
            Perfect for families looking to organize tasks efficiently.
          </p>

          <div className="flex justify-center mb-12">
            <img 
              src={vacuumKidImage} 
              alt="Child vacuuming" 
              className="max-w-sm w-full h-auto rounded-lg shadow-dark-md transform hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/signin"
              className="px-8 py-3 bg-blue-600 text-dark-50 rounded-lg hover:bg-blue-700 transition-colors-all duration-300 font-semibold text-lg min-w-[160px] shadow-dark-subtle"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-8 py-3 bg-dark-800 text-blue-400 border-2 border-blue-500 rounded-lg hover:bg-dark-700 transition-colors-all duration-300 font-semibold text-lg min-w-[160px] shadow-dark-subtle"
            >
              Sign Up
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-dark-800 rounded-lg shadow-dark-md hover:bg-dark-700 transition-colors-all duration-300">
              <h3 className="text-xl font-bold text-dark-50 mb-3">Easy Task Management</h3>
              <p className="text-dark-200">Organize and track household chores with our intuitive interface.</p>
            </div>
            <div className="p-6 bg-dark-800 rounded-lg shadow-dark-md hover:bg-dark-700 transition-colors-all duration-300">
              <h3 className="text-xl font-bold text-dark-50 mb-3">Family Friendly</h3>
              <p className="text-dark-200">Assign and monitor tasks for every family member.</p>
            </div>
            <div className="p-6 bg-dark-800 rounded-lg shadow-dark-md hover:bg-dark-700 transition-colors-all duration-300">
              <h3 className="text-xl font-bold text-dark-50 mb-3">Progress Tracking</h3>
              <p className="text-dark-200">Keep track of completed tasks and maintain accountability.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;