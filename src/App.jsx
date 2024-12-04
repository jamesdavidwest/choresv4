// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import LandingPage from './pages/LandingPage';
import SignIn from './components/auth/SignIn';
import { Dashboard } from './components/dashboard';
import { ChoresManagement, ChoreForm } from './components/chores';

// Create a separate component for protected routes
const ProtectedRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chores" element={<ChoresManagement />} />
        <Route path="/chores/new" element={<ChoreForm />} />
        <Route path="/chores/:id/edit" element={<ChoreForm />} />
      </Route>
    </Routes>
  );
};

// Create a component for the app's routes
const AppRoutes = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </AuthProvider>
  );
};

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;