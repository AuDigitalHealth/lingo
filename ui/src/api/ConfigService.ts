import axios from 'axios';
import ApplicationConfig, { ServiceStatus } from '../types/applicationConfig';
import { FieldBindings } from '../types/FieldBindings.ts';
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
    const applicationConfig = response.data as ApplicationConfig;
    return applicationConfig;
  },
  async loadFieldBindings(branch: string): Promise<FieldBindings> {
    const response = await axios.get(
      `/api/${branch}/medications/field-bindings`,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const map = new Map(Object.entries(response.data as JSON));

    const fieldBindings: FieldBindings = {
      bindingsMap: map,
    };
    return fieldBindings;
  },
  async getServiceStatus(): Promise<ServiceStatus> {
    const response = await axios.get('/api/status');
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as ServiceStatus;
  },
};
