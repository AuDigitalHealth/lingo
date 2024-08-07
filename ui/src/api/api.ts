/* eslint-disable */
import axios from 'axios';
import useUserStore from '../stores/UserStore';
import { useQueryClient } from '@tanstack/react-query';
import { getAuthorizationQueryOptions } from '../hooks/api/auth/useAuthorization';

export const api = axios.create({});

api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    const message = error.response?.data?.message || error.message;
    if (
      error.response?.status === 403 &&
      window.location.href.includes('/dashboard')
    ) {
      useUserStore.setState({ loginRefreshRequired: true });
    }
    return Promise.reject(error);
  },
);
