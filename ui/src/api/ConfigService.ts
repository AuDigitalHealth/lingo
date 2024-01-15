import axios from 'axios';
import ApplicationConfig, { ServiceStatus } from '../types/applicationConfig';

export const ConfigService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid Jira user response');
  },

  async getApplicationConfig(): Promise<ApplicationConfig> {
    const response = await axios.get('/config');
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as ApplicationConfig;
  },
  async getServiceStatus(): Promise<ServiceStatus> {
    const response = await axios.get('/api/status');
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as ServiceStatus;
  },
};
