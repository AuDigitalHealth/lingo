import axios from 'axios';
import { AuthState } from '../types/authorisation';

const TasksServices = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid task response');
  },

  async getAuthorization(): Promise<AuthState> {
    const response = await axios.get('/api/auth');
    const statusCode = response.status;
    let authorised = false;
    let errorMessage = '';

    if (statusCode === 200) {
      authorised = true;
    } else {
      errorMessage = response.statusText;
    }

    const authState: AuthState = {
      statusCode: statusCode,
      authorised: authorised,
      fetching: false,
      errorMessage: errorMessage,
    };

    return authState;
  },
};

export default TasksServices;
