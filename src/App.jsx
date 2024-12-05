import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Suspense } from 'react';
import { ChoresProvider } from './context/ChoresContext';
import { AuthProvider } from './context/AuthContext';
import { router } from './routes';

const App = () => {
  const browserRouter = createBrowserRouter(router);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthProvider>
        <ChoresProvider>
          <RouterProvider 
            router={browserRouter} 
            future={{ v7_startTransition: true }}
          />
        </ChoresProvider>
      </AuthProvider>
    </Suspense>
  );
};

export default App;