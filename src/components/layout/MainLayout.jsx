// src/components/layout/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import Toolbar from './Toolbar';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;