import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { useAuth } from './context/AuthContext';

// Lazy load these components
const Calendar = lazy(() => import('./pages/calendar/index.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

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
        element: <LandingPage />
      },
      {
        path: 'signin',
        element: <SignIn />
      },
      {
        path: 'signup',
        element: <SignUp />
      },
      {
        path: 'calendar',
        element: <ProtectedRoute><WrappedCalendar /></ProtectedRoute>
      },
      {
        path: 'dashboard',
        element: <ProtectedRoute><WrappedDashboard /></ProtectedRoute>
      }
    ]
  }
];