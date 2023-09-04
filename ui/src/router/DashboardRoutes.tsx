import CloseSnackbar from '../components/snackbar/CloseSnackBar';
import MainLayout from '../layouts/MainLayout';
import TasksLayout from '../layouts/TasksLayout';
import TicketsBacklog from '../layouts/pages/TicketsBacklog';
import ProtectedRoute from './ProtectedRoute';
import { SnackbarProvider } from 'notistack';
import ConceptsLayout from '../layouts/ConceptsLayout.tsx';

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
    {
      path: 'tickets/board',
      element: <div>placeholder</div>,
    },
    {
      path: 'tickets/backlog',
      element: <TicketsBacklog />,
    },
    {
      path: 'concepts/*',
      element: <ConceptsLayout />,
    },
  ],
};

export default DashboardRoutes;
