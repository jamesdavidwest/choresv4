import { lazy, Suspense } from 'react';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';

// Lazy load these components
const Calendar = lazy(() => import('./pages/calendar/index.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));

// Wrap lazy components with Suspense and ErrorBoundary
const WrappedCalendar = () => (
  <ErrorBoundary>
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>}>
      <Calendar />
    </Suspense>
  </ErrorBoundary>
);

const WrappedDashboard = () => (
  <ErrorBoundary>
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>}>
      <Dashboard />
    </Suspense>
  </ErrorBoundary>
);

export const router = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'calendar',
        element: <WrappedCalendar />
      },
      {
        path: 'dashboard',
        element: <WrappedDashboard />
      }
    ]
  }
];