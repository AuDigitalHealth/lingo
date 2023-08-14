import { useEffect } from 'react';
import useUserStore from '../stores/UserStore';
import useAuthStore from '../stores/AuthStore';
import { useNavigate } from 'react-router-dom';
import { UserState } from '../types/user';
import Loading from '../components/Loading';

const baseUrl = `${import.meta.env.VITE_SNOMIO_PROD_UI_URL}`;

function AuthorisationLayout() {
  const userStore = useUserStore();
  const authStore = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    authStore.updateFetching(true);

    fetch(baseUrl + '/api/auth')
      .then(response => {
        console.log(response);
        authStore.updateFetching(false);
        if (response.status === 200) {
          authStore.updateAuthorised(true);

          response
            .json()
            .then((json: UserState) => {
              userStore.updateUserState(json);
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
          navigate('/login');
        }
      })
      .catch(err => {
        // TODO: fix me, proper error handling
        console.log('in error');
        console.log(err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Loading />;
}

export default AuthorisationLayout;
