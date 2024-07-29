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
