import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-slate-800 text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">Chores App</Link>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-blue-400">Home</Link>
            <Link to="/calendar" className="hover:text-blue-400">Calendar</Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;