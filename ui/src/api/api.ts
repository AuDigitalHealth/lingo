///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

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
