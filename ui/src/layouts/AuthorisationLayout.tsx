import { useEffect } from 'react';
import useUserStore from '../stores/UserStore';
import useAuthStore from '../stores/AuthStore';
import { useNavigate } from 'react-router-dom';

function AuthorisationLayout() {
  const userStore = useUserStore();
  const authStore = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    authStore.updateFetching(true);
    fetch('/api/auth').then(response => {
      authStore.updateFetching(false);
      if (response.status === 200) {
        authStore.updateAuthorised(true);

        response.json().then(json => {
          userStore.updateUserState(json);
        });

        navigate('/dashboard');
      } else {

        authStore.updateAuthorised(false);
        userStore.updateUserState({
          login: null,
          firstName: null,
          lastName: null,
          email: null,
          roles: [],
        });
        navigate('/login');
      }
    });
  }, []);

  return (
    <div>
      Auth page (
      {authStore.fetching ? <div>fetching</div> : <div>fetched</div>})
    </div>
  );
}

export default AuthorisationLayout;
