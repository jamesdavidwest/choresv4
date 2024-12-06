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
const Chores = lazy(() => import('./components/chores/ChoresManagement.jsx'));
const ChoreForm = lazy(() => import('./components/chores/ChoreForm.jsx'));

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

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Wrap lazy components with Suspense and ErrorBoundary
const withSuspense = (Component) => (
  <ErrorBoundary>
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <Component />
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
        element: <ProtectedRoute>{withSuspense(Calendar)}</ProtectedRoute>
      },
      {
        path: 'dashboard',
        element: <ProtectedRoute>{withSuspense(Dashboard)}</ProtectedRoute>
      },
      {
        path: 'chores',
        element: <AdminRoute>{withSuspense(Chores)}</AdminRoute>
      },
      {
        path: 'chores/new',
        element: <AdminRoute>{withSuspense(ChoreForm)}</AdminRoute>
      },
      {
        path: 'chores/edit/:id',
        element: <AdminRoute>{withSuspense(ChoreForm)}</AdminRoute>
      }
    ]
  }
];