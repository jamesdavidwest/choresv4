import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { useAuth } from './context/AuthContext';

// Lazy load these components
const Calendar = lazy(() => import('./pages/calendar/index.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Tasks = lazy(() => import('./components/tasks/TasksManagement.jsx'));
const TaskForm = lazy(() => import('./components/tasks/TasksForm.jsx'));

const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Protected Route Component
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

// Admin Route Component
export const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired
};

// Pre-wrapped components with Suspense and ErrorBoundary
export const SuspendedCalendar = () => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
      <Calendar />
    </Suspense>
  </ErrorBoundary>
);

export const SuspendedDashboard = () => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
      <Dashboard />
    </Suspense>
  </ErrorBoundary>
);

export const SuspendedTasks = () => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
      <Tasks />
    </Suspense>
  </ErrorBoundary>
);

export const SuspendedTaskForm = () => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
      <TaskForm />
    </Suspense>
  </ErrorBoundary>
);

// Routes configuration
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
        element: <ProtectedRoute><SuspendedCalendar /></ProtectedRoute>
      },
      {
        path: 'dashboard',
        element: <ProtectedRoute><SuspendedDashboard /></ProtectedRoute>
      },
      {
        path: 'tasks',
        element: <AdminRoute><SuspendedTasks /></AdminRoute>
      },
      {
        path: 'tasks/new',
        element: <AdminRoute><SuspendedTaskForm /></AdminRoute>
      },
      {
        path: 'tasks/edit/:id',
        element: <AdminRoute><SuspendedTaskForm /></AdminRoute>
      }
    ]
  }
];
