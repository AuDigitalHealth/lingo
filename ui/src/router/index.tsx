import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';

// project import
// import LoginRoutes from './LoginRoutes';
import Authorisation from '../pages/auth/Authorisation';
import ProtectedRoute from './ProtectedRoute';
import { SnackbarProvider } from 'notistack';
import CloseSnackbar from '../components/snackbar/CloseSnackBar';
import MainLayout from '../layouts/MainLayout';
import TasksRoutes from './TasksRoutes';
import TaskEditLayout from '../pages/tasks/TaskEditLayout';
import TasksList from '../pages/tasks/components/TasksList';
import TicketsRoutes from './TicketsRoutes';
import TicketsBacklog from '../pages/tickets/TicketsBacklog';
import IndividualTicketEdit from '../pages/tickets/individual/IndividualTicketEdit';
import ProductRoutes from './ProductRoutes';
import ProductModelView from '../pages/products/ProductModelView';
import Login from '../pages/auth/Login';
import SettingsRoutes from './SettingsRoutes';
import { ReleaseSettings } from '../pages/settings/ReleaseSettings.tsx';
import { LabelsSettings } from '../pages/settings/LabelsSettings.tsx';
import UserDefinedTables from '../pages/tickets/UserDefinedTables.tsx';
import { StyledSnackbar } from '../components/styled/StyledSnackbar.tsx';

import ECLRefsetRoutes from './ECLRefsetRoutes.tsx';
import ConceptDiagram from '../components/ConceptDiagram.tsx';
import { ExternalRequestorsSettings } from '../pages/settings/ExternalRequestorsSettings.tsx';

// ==============================|| ROUTING RENDER ||============================== //

export const browserRouter = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Authorisation />}>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <SnackbarProvider
              autoHideDuration={3000000}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              Components={{
                success: StyledSnackbar,
                error: StyledSnackbar,
              }}
              preventDuplicate={true}
              action={snackbarKey => (
                <CloseSnackbar snackbarKey={snackbarKey} />
              )}
            >
              <MainLayout />
            </SnackbarProvider>
          </ProtectedRoute>
        }
      >
        <Route path="" element={<ConceptDiagram />} />
        {/* All Tasks Routes */}
        <Route path="/dashboard/tasks" element={<TasksRoutes />}>
          <Route
            path="/dashboard/tasks"
            element={<TasksList path="" heading="My Tasks" />}
          />
          <Route
            path="/dashboard/tasks/all"
            element={<TasksList path="/all" heading="Tasks" />}
          />
          <Route
            path="/dashboard/tasks/needReview"
            element={
              <TasksList path="/needReview" heading="Tasks Requiring Review" />
            }
          />

          <Route
            path="/dashboard/tasks/edit/:id/*"
            element={<TaskEditLayout />}
          />
        </Route>
        {/* All Tickets routes */}
        <Route path="/dashboard/tickets" element={<TicketsRoutes />}>
          <Route
            path="/dashboard/tickets/backlog"
            element={<TicketsBacklog />}
          />
          <Route
            path="/dashboard/tickets/backlog/tables"
            element={<UserDefinedTables />}
          />
          <Route
            path="/dashboard/tickets/individual/:id"
            element={<IndividualTicketEdit />}
          />
        </Route>
        {/* Search product Routes */}
        <Route path="/dashboard/products" element={<ProductRoutes />}>
          <Route
            path="/dashboard/products/:id"
            element={<ProductModelView />}
          />
        </Route>
        <Route path="/dashboard/settings" element={<SettingsRoutes />}>
          <Route
            path="/dashboard/settings/label"
            element={<LabelsSettings />}
          />
          <Route
            path="/dashboard/settings/release"
            element={<ReleaseSettings />}
          />
          <Route
            path="/dashboard/settings/externalRequestors"
            element={<ExternalRequestorsSettings />}
          />
        </Route>

        {/* ECL Refset Tool */}
        <Route path="eclRefsetTool/*" element={<ECLRefsetRoutes />} />
      </Route>
    </Route>,
  ),
);
