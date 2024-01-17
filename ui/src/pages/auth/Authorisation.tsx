import { useEffect } from 'react';
import useUserStore from '../../stores/UserStore';
import useAuthStore from '../../stores/AuthStore';
import { useNavigate } from 'react-router-dom';
import { UserState } from '../../types/user';
import Loading from '../../components/Loading';
import Login from './Login';
import AuthWrapper from './components/auth/AuthWrapper';
import { Stack } from '@mui/material';
import { useInitializeConfig } from '../../hooks/api/useInitializeConfig.tsx';

function Authorisation() {
  const userStore = useUserStore();
  const authStore = useAuthStore();
  const navigate = useNavigate();
  const { applicationConfigIsLoading } = useInitializeConfig();

  useEffect(() => {
    authStore.updateFetching(true);

    fetch('/api/auth')
      .then(response => {
        if (response.status === 200) {
          authStore.updateAuthorised(true);

          response
            .json()
            .then((json: UserState) => {
              userStore.updateUserState(json);
              authStore.updateFetching(false);
            })
            .catch(err => {
              // TODO: fix me, proper error handling
              console.log(err);
            });
          if (authStore.desiredRoute !== '') {
            navigate(authStore.desiredRoute);
          } else {
            navigate('/dashboard');
          }
        } else {
          console.log(' not 200, authstore should be updated');
          authStore.updateAuthorised(false);
          authStore.updateFetching(false);
          userStore.updateUserState({
            login: null,
            firstName: null,
            lastName: null,
            email: null,
            roles: [],
          });
          authStore.updateFetching(false);
        }
      })
      .catch(err => {
        // TODO: fix me, proper error handling
        console.log(err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // return <>{authStore.fetching ? <Loading /> : <Login />}</>;
  return (
    <AuthWrapper>
      <Stack
        direction="column"
        justifyContent="space-between"
        alignItems="center"
        // sx={{ mb: { xs: -0.5, sm: 0.5 } }}
      >
        {authStore.fetching || applicationConfigIsLoading ? (
          <Loading />
        ) : (
          <Login />
        )}
      </Stack>
    </AuthWrapper>
  );
}

export default Authorisation;
