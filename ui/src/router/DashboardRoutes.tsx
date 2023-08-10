import MainLayout from '../layouts/MainLayout';
import TasksLayout from '../layouts/TasksLayout';
import ProtectedRoute from './ProtectedRoute';

const DashboardRoutes = {
  path: 'dashboard',
  element: (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      path: '',
      element: <div>hello</div>,
    },
    {
      path: 'tasks/*',
      element: <TasksLayout />,
    },
  ],
};

export default DashboardRoutes;
