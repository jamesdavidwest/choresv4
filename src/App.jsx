// src/App.jsx
import { 
  createBrowserRouter, 
  RouterProvider, 
  createRoutesFromElements,
  Route,
  Navigate
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChoresProvider } from './context/ChoresContext';
import MainLayout from './components/layout/MainLayout';
import LandingPage from './pages/LandingPage';
import SignIn from './components/auth/SignIn';
import { Dashboard } from './components/dashboard';
import { ChoresManagement, ChoreForm } from './components/chores';
import CalendarPage from './pages/calendar/CalendarPage';

// Create routes configuration with Auth wrapping the protected routes
const routes = createRoutesFromElements(
  <Route>
    <Route path="/" element={<LandingPage />} />
    <Route path="/signin" element={<SignIn />} />
    <Route element={
      <AuthProvider>
        <ChoresProvider>
          <MainLayout />
        </ChoresProvider>
      </AuthProvider>
    }>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/chores" element={<ChoresManagement />} />
      <Route path="/chores/new" element={<ChoreForm />} />
      <Route path="/chores/:id/edit" element={<ChoreForm />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route>
);

// Create the router with the routes configuration
const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true,
  },
});

function App() {
  return <RouterProvider router={router} />;
}

export default App;