import CloseSnackbar from '../components/snackbar/CloseSnackBar';
import MainLayout from '../layouts/MainLayout';
import TasksLayout from '../layouts/TasksLayout';
import ProtectedRoute from './ProtectedRoute';
import { SnackbarProvider } from 'notistack';

const DashboardRoutes = {
  path: 'dashboard',
  element: (
    <ProtectedRoute>
      <SnackbarProvider
        autoHideDuration={3000000}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        preventDuplicate={true}
        action={snackbarKey => <CloseSnackbar snackbarKey={snackbarKey} />}
      >
        <MainLayout />
      </SnackbarProvider>
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
