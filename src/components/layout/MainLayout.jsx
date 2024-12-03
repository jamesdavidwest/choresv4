// src/components/layout/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import Toolbar from './Toolbar';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 dark:text-gray-100">
      <Toolbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
