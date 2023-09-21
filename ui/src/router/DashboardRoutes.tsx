import CloseSnackbar from '../components/snackbar/CloseSnackBar';
import MainLayout from '../layouts/MainLayout';
import TasksRoutes from './TasksRoutes.tsx';
import ProtectedRoute from './ProtectedRoute';
import { SnackbarProvider } from 'notistack';
import ProductRoutes from './ProductRoutes.tsx';
import TicketsRoutes from './TicketsRoutes.tsx';

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
      element: <div>Coming soon to a computer near you!</div>,
    },
    {
      path: 'tasks/*',
      element: <TasksRoutes />,
    },
    {
      path: 'tickets/*',
      element: <TicketsRoutes />,
    },
    {
      path: 'products/*',
      element: <ProductRoutes />,
    },
  ],
};

export default DashboardRoutes;
