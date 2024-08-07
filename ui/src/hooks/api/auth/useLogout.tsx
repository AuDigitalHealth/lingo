import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthorizationQueryOptions } from './useAuthorization';
import AuthService from '../../../api/AuthService';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/AuthStore';
import useUserStore from '../../../stores/UserStore';

export const useLogout = () => {
  const navigate = useNavigate();
  const { resetAuthStore } = useAuthStore();
  const { logout } = useUserStore();
  const queryClient = useQueryClient();

  return useMutation({
    onSuccess: () => {
      resetAuthStore();
      logout();
      void queryClient
        .invalidateQueries({
          queryKey: getAuthorizationQueryOptions().queryKey,
        })
        .then(() => {
          navigate('/login');
        });
    },
    mutationFn: () => {
      return AuthService.logout();
    },
  });
};
