import React from 'react';
import { Outlet } from 'react-router-dom';
import Toolbar from './layout/Toolbar';

const Layout = () => {
  return (
    <div>
      <Toolbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;