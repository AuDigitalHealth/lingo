import { Navigate, useLocation } from 'react-router-dom';
import useUserStore from '../stores/UserStore';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import BaseModal from '../components/modal/BaseModal';
import BaseModalHeader from '../components/modal/BaseModalHeader';
import BaseModalBody from '../components/modal/BaseModalBody';
import BaseModalFooter from '../components/modal/BaseModalFooter';
import { Button } from '@mui/material';
import useApplicationConfigStore from '../stores/ApplicationConfigStore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  getAuthorizationQueryOptions,
  useAuthorization,
} from '../hooks/api/auth/useAuthorization';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  children?: ReactNode;
}
function ProtectedRoute({ children }: Props) {
  const user = useUserStore();
  const location = useLocation();

  if (!user.login) {
    sessionStorage.setItem('attemptedRoute', location.pathname);
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <RefreshLoginModal />
      {children}
    </>
  );
}

function RefreshLoginModal() {
  const { loginRefreshRequired } = useUserStore();
  const [open, setOpen] = useState(loginRefreshRequired);
  const applicationConfig = useApplicationConfigStore();
  const queryClient = useQueryClient();
  const authorizationQuery = useAuthorization();

  useEffect(() => {
    setOpen(loginRefreshRequired);
  }, [loginRefreshRequired]);

  const checkLoginStatus = useCallback(() => {
    if (loginRefreshRequired) {
      void queryClient.resetQueries({
        queryKey: getAuthorizationQueryOptions().queryKey,
      });
    }
  }, [loginRefreshRequired, queryClient]);

  useEffect(() => {
    const handleFocus = () => {
      checkLoginStatus();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkLoginStatus]);

  return (
    <>
      <BaseModal open={open ? open : false} keepMounted={false}>
        <BaseModalHeader title={'Refresh Login'} />
        <BaseModalBody>
          You are currently not logged in, please login again to be able to
          continue using the application.
        </BaseModalBody>
        <BaseModalFooter
          startChildren={<></>}
          endChildren={
            <Button
              variant="contained"
              fullWidth
              disabled={authorizationQuery.isFetching}
              href={`${applicationConfig.applicationConfig.imsUrl}`}
              startIcon={<OpenInNewIcon />}
              target="_blank"
            >
              Log in through IMS
            </Button>
          }
        />
      </BaseModal>
    </>
  );
}

export default ProtectedRoute;
