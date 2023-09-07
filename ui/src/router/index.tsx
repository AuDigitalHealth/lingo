import { useRoutes } from 'react-router-dom';

// project import
// import LoginRoutes from './LoginRoutes';
import DashboardRoutes from './DashboardRoutes';
import Authorisation from '../pages/auth/Authorisation';

// ==============================|| ROUTING RENDER ||============================== //

export default function Router() {
  return useRoutes([
    {
      path: '/',
      element: <Authorisation />,
    },
    DashboardRoutes,
  ]);
}
