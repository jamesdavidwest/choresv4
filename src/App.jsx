import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Suspense } from 'react';
import { TasksProvider } from './context/TasksContext';
import { AuthProvider } from './context/AuthContext';
import { router } from './routes';

const App = () => {
  const browserRouter = createBrowserRouter(router);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthProvider>
        <TasksProvider>
          <RouterProvider 
            router={browserRouter} 
            future={{ v7_startTransition: true }}
          />
        </TasksProvider>
      </AuthProvider>
    </Suspense>
  );
};

export default App;
