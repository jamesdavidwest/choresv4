// src/pages/LandingPage.jsx
import { Link } from 'react-router-dom';
import vacuumKidImage from '../assets/vacuum_kid.png';

const LandingPage = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to ChoresApp</h1>
        <p className="text-xl text-gray-600 mb-8">
          Manage your household tasks efficiently
        </p>
        <div className="flex justify-center mb-8">
          <img 
            src={vacuumKidImage} 
            alt="Child vacuuming" 
            className="max-w-xs w-full h-auto rounded-lg shadow-md"
          />
        </div>
        <Link
          to="/signin"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
