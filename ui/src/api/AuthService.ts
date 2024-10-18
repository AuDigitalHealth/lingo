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

import { AxiosResponse } from 'axios';
import { unauthorizedApi } from './unauthorizedApi';
import { UserState } from '../types/user';
import { api } from './api';

const AuthService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.
  // eslint-disable-next-line
  handleErrors: (response: AxiosResponse<any, any>) => {
    console.log(response);
    throw new Error('invalid task response');
  },

  async getAuthorization(): Promise<UserState> {
    const response = await unauthorizedApi.get('/api/auth');
    const statusCode = response.status;

    if (statusCode !== 200) {
      this.handleErrors(response);
    }
    return response.data as UserState;
  },

  async logout(): Promise<Response> {
    return await api.post('/api/auth/logout', { withCredentials: true });
  },
};

export default AuthService;
