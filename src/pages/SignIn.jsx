import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignIn = () => {
  const [email, setEmail] = useState('admin@local');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (!email.trim()) {
        throw new Error('Email is required');
      }
      if (!password.trim()) {
        throw new Error('Password is required');
      }

      // For development, log the attempt
      console.log('Attempting login with:', { email });
      
      await login({ 
        email: email.trim(),
        password: password.trim()
      });
      // AuthContext handles the redirect
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <div className="bg-dark-800 p-8 rounded-lg shadow-dark-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-dark-50 mb-6 text-center">
          Sign In
        </h2>
        
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-dark-100">
              Email
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-dark-700 border border-dark-600 text-dark-100 rounded-md shadow-dark-subtle focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-dark-100">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-dark-700 border border-dark-600 text-dark-100 rounded-md shadow-dark-subtle focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-dark-md text-sm font-medium text-dark-50 bg-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors-all duration-300"
          >
            Sign In
          </button>
        </form>

        <div className="mt-4 text-sm text-dark-300">
          <p>Default credentials:</p>
          <p>Email: admin@local</p>
          <p>Password: password</p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;