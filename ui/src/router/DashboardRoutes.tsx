import CloseSnackbar from '../components/snackbar/CloseSnackBar';
import MainLayout from '../layouts/MainLayout';
import TasksRoutes from './TasksRoutes.tsx';
import TicketsBacklog from '../pages/tickets/TicketsBacklog.tsx';
import ProtectedRoute from './ProtectedRoute';
import { SnackbarProvider } from 'notistack';
import ConceptsRoutes from './ConceptsRoutes.tsx';
import TicketsBoard from '../pages/tickets/TicketsBoard.tsx';

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
      element: <TasksRoutes />,
    },
    {
      path: 'tickets/board',
      // element: <TicketsBoard />,
      element: <div>Coming soon to a computer near you!</div>
    },
    {
      path: 'tickets/backlog',
      element: <TicketsBacklog />,
    },
    {
      path: 'concepts/*',
      element: <ConceptsRoutes />,
    },
  ],
};

export default DashboardRoutes;
