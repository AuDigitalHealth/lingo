import { useEffect } from 'react';
import useUserStore from '../../stores/UserStore';
import useAuthStore from '../../stores/AuthStore';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { UserState } from '../../types/user';
import Loading from '../../components/Loading';
import AuthWrapper from './components/auth/AuthWrapper';
import { Stack } from '@mui/material';
import { useInitializeConfig } from '../../hooks/api/useInitializeConfig.tsx';

function Authorisation() {
  const userStore = useUserStore();
  const {
    fetching,
    updateFetching,
    authorised,
    updateAuthorised,
    desiredRoute,
    updateDesiredRoute,
  } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { applicationConfigIsLoading } = useInitializeConfig();

  useEffect(() => {
    if (!userStore.login) {
      if (desiredRoute === '') {
        updateDesiredRoute(
          location.pathname === '/' ? '/dashboard' : location.pathname,
        );
      }
    }
  });

  useEffect(() => {
    updateFetching(true);

    fetch('/api/auth')
      .then(response => {
        if (response.status === 200) {
          updateAuthorised(true);

          response
            .json()
            .then((json: UserState) => {
              userStore.updateUserState(json);
              updateFetching(false);
            })
            .catch(err => {
              // TODO: fix me, proper error handling
              console.log(err);
            });
          if (desiredRoute !== '') {
            navigate(desiredRoute);
          } else {
            navigate('/dashboard');
          }
        } else {
          console.log(' not 200, authstore should be updated');
          updateAuthorised(false);
          updateFetching(false);
          userStore.updateUserState({
            login: null,
            firstName: null,
            lastName: null,
            email: null,
            roles: [],
          });
          updateFetching(false);
          navigate('/login');
        }
      })
      .catch(err => {
        // TODO: fix me, proper error handling
        console.log(err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorised]);

  if (!(fetching && applicationConfigIsLoading) && userStore.login) {
    return <Outlet />;
  } else if (!fetching && !applicationConfigIsLoading && !authorised) {
    return (
      <AuthWrapper>
        <Stack
          direction="column"
          justifyContent="space-between"
          alignItems="center"
          // sx={{ mb: { xs: -0.5, sm: 0.5 } }}
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
            // sx={{ mb: { xs: -0.5, sm: 0.5 } }}
          >
            {fetching || (applicationConfigIsLoading && <Loading />)}
            {/* {!(authStore.fetching && applicationConfigIsLoading) &&
            !userStore.login && <Login />} */}
          </Stack>
        </AuthWrapper>
        {!(fetching && applicationConfigIsLoading) && userStore.login && (
          <Outlet />
        )}
      </>
    );
  }
}

export default Authorisation;
