import { useRoutes } from 'react-router-dom';

// project import
// import LoginRoutes from './LoginRoutes';
import DashboardRoutes from './DashboardRoutes';
import AuthorisationLayout from '../layouts/AuthorisationLayout';

// ==============================|| ROUTING RENDER ||============================== //

export default function Router() {
  return useRoutes([
    {
      path: '/',
      element: <AuthorisationLayout />,
    },
    DashboardRoutes,
  ]);
}
