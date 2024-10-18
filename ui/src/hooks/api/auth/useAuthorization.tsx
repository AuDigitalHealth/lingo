import { queryOptions, useQuery } from '@tanstack/react-query';
import AuthService from '../../../api/AuthService';
import useUserStore from '../../../stores/UserStore';
import { useEffect } from 'react';
import useAuthStore from '../../../stores/AuthStore';

export const getAuthorizationQueryOptions = () => {
  return queryOptions({
    queryKey: ['auth'],
    queryFn: () => AuthService.getAuthorization(),
    retry: false,
  });
};

export const useAuthorization = () => {
  const userStore = useUserStore();
  const { updateAuthState } = useAuthStore();
  const useAuthorizationQuery = useQuery({
    ...getAuthorizationQueryOptions(),
  });

  useEffect(() => {
    if (useAuthorizationQuery.data) {
      userStore.updateUserState(useAuthorizationQuery.data);
      userStore.setLoginRefreshRequired(false);
      updateAuthState({
        statusCode: 200,
        authorised: true,
        fetching: false,
        errorMessage: '',
      });
    }
    // eslint-disable-next-line
  }, [useAuthorizationQuery.data]);

  return useAuthorizationQuery;
};
