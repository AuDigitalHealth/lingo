import { useCallback, useEffect } from 'react';
import useUserStore from '../../stores/UserStore';
import useAuthStore from '../../stores/AuthStore';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { UserState } from '../../types/user';
import Loading from '../../components/Loading';
import AuthWrapper from './components/auth/AuthWrapper';
import { Stack } from '@mui/material';
import { useInitializeConfig } from '../../hooks/api/useInitializeConfig.tsx';
import { useAuthorization } from '../../hooks/api/auth/useAuthorization.tsx';

function Authorisation() {
  const userStore = useUserStore();
  const { authorised } = useAuthStore();
  const navigate = useNavigate();
  const { applicationConfigIsLoading } = useInitializeConfig();
  const authorizationQuery = useAuthorization();

  const handleLogin = useCallback(() => {
    // Get the attempted route from the session storage
    const attemptedRoute =
      sessionStorage.getItem('attemptedRoute') || '/dashboard/tasks';
    // Redirect to the attempted route
    navigate(attemptedRoute);
    // Clear the session storage
  }, [navigate]);

  useEffect(() => {
    if (authorizationQuery.data && userStore.loginRefreshRequired !== true) {
      handleLogin();
    }
  }, [authorizationQuery.data, handleLogin, userStore.loginRefreshRequired]);

  if (
    !(authorizationQuery.isLoading && applicationConfigIsLoading) &&
    userStore.login
  ) {
    return <Outlet />;
  } else if (
    !authorizationQuery.isLoading &&
    !applicationConfigIsLoading &&
    !authorised
  ) {
    return (
      <AuthWrapper>
        <Stack
          direction="column"
          justifyContent="space-between"
          alignItems="center"
        >
          <Outlet />
        </Stack>
      </AuthWrapper>
    );
  } else {
    return (
      <>
        <AuthWrapper>
          <Stack
            direction="column"
            justifyContent="space-between"
            alignItems="center"
          >
            {authorizationQuery.isLoading ||
              (applicationConfigIsLoading && <Loading />)}
          </Stack>
        </AuthWrapper>
        {!(authorizationQuery.isLoading && applicationConfigIsLoading) &&
          userStore.login && <Outlet />}
      </>
    );
  }
}

export default Authorisation;
