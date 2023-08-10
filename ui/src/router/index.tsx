import { useRoutes } from 'react-router-dom';

// project import
// import LoginRoutes from './LoginRoutes';
import DashboardRoutes from './DashboardRoutes';
import AuthorisationLayout from '../layouts/AuthorisationLayout';
import LoginLayout from '../layouts/LoginLayout';

// ==============================|| ROUTING RENDER ||============================== //

export default function Router() {
  return useRoutes([
    {
      path: '/',
      element: <AuthorisationLayout />,
      children: [
        {
          path: 'login',
          element: <LoginLayout />,
        },
      ],
    },
    DashboardRoutes,
  ]);
}
