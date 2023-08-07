import { Navigate, useLocation } from 'react-router-dom';
import useUserStore from '../stores/UserStore';
import { ReactNode } from 'react';
import useAuthStore from '../stores/AuthStore';

interface Props {
  children?: ReactNode;
}
function ProtectedRoute({ children }: Props) {
  const authStore = useAuthStore();
  const user = useUserStore();
  const location = useLocation();

  if (!user.login) {
    if (authStore.desiredRoute === '') {
      // we only update the desired route if it's empty, otherwise your guaranteed to end up at /dashboard
      authStore.updateDesiredRoute(location.pathname);
    }
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default ProtectedRoute;
