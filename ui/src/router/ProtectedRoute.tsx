import { Navigate } from 'react-router-dom';
import useUserStore from '../stores/UserStore';
import { ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}
function ProtectedRoute({ children }: Props) {
  const user = useUserStore();

  if (!user.login) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default ProtectedRoute;
