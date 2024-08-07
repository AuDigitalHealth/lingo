import { JiraUser } from '../types/JiraUserResponse.ts';
import { api } from './api.ts';
const JiraUserService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid Jira user response');
  },

  async getAllJiraUsers(): Promise<JiraUser[]> {
    const response = await api.get('/api/users');
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as JiraUser[];
  },
};

export default JiraUserService;
