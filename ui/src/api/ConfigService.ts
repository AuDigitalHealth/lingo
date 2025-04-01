import ApplicationConfig, {
  SecureAppConfig,
  ServiceStatus,
} from '../types/applicationConfig';
import { FieldBindings } from '../types/FieldBindings.ts';
import { api } from './api.ts';
import { unauthorizedApi } from './unauthorizedApi.ts';
import axios from 'axios';
export const ConfigService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid Jira user response');
  },

  async getApplicationConfig(): Promise<ApplicationConfig> {
    const response = await unauthorizedApi.get('/config');
    if (response.status != 200) {
      this.handleErrors();
    }
    const applicationConfig = response.data as ApplicationConfig;
    return applicationConfig;
  },

  async getSecureApplicationConfig(): Promise<SecureAppConfig> {
    const response = await api.get('/api/config');
    if (response.status != 200) {
      this.handleErrors();
    }
    const secureApplicationConfig = response.data as SecureAppConfig;
    return secureApplicationConfig;
  },
  async loadFieldBindings(branch: string): Promise<FieldBindings> {
    const response = await api.get(`/api/${branch}/medications/field-bindings`);
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
    const response = await api.get('/api/status');
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as ServiceStatus;
  },
  async getReleaseVersion(): Promise<string> {
    const response = await axios.get('/buildnumber.txt');
    if (response.status !== 200) {
      throw new Error('Failed to fetch release version');
    }
    return response.data as string;
  },
  async fetchMedicationUiSchemaData(branchPath: string) {
    const uiSchemaResponse = await fetch(
      `/config/medication/${branchPath}/ui-schema`,
    );
    if (!uiSchemaResponse.ok) {
      throw new Error(`HTTP error! status: ${uiSchemaResponse.status}`);
    }
    return (await uiSchemaResponse.json()) as string;
  },
  async fetchMeddicationSchemaData(branchPath: string) {
    const schemaResponse = await fetch(
      `/config/medication/${branchPath}/schema`,
    );
    if (!schemaResponse.ok) {
      throw new Error(`HTTP error! status: ${schemaResponse.status}`);
    }
    return (await schemaResponse.json()) as string;
  },
  async fetchDeviceUiSchemaData(branchPath: string) {
    const uiSchemaResponse = await fetch(
      `/config/device/${branchPath}/ui-schema`,
    );
    if (!uiSchemaResponse.ok) {
      throw new Error(`HTTP error! status: ${uiSchemaResponse.status}`);
    }
    return (await uiSchemaResponse.json()) as string;
  },
  async fetchDeviceSchemaData(branchPath: string) {
    const schemaResponse = await fetch(`/config/device/${branchPath}/schema`);
    if (!schemaResponse.ok) {
      throw new Error(`HTTP error! status: ${schemaResponse.status}`);
    }
    return (await schemaResponse.json()) as string;
  },
  async fetchBulkBrandSchemaData(branchPath: string) {
    const schemaResponse = await fetch(
      `/config/bulk-brand/${branchPath}/schema`,
    );
    if (!schemaResponse.ok) {
      throw new Error(`HTTP error! status: ${schemaResponse.status}`);
    }
    return (await schemaResponse.json()) as string;
  },
  async fetchBulkBrandUiSchemaData(branchPath: string) {
    const schemaResponse = await fetch(
      `/config/bulk-brand/${branchPath}/ui-schema`,
    );
    if (!schemaResponse.ok) {
      throw new Error(`HTTP error! status: ${schemaResponse.status}`);
    }
    return (await schemaResponse.json()) as string;
  },
  async fetchBulkPackSchemaData(branchPath: string) {
    const schemaResponse = await fetch(
      `/config/bulk-pack/${branchPath}/schema`,
    );
    if (!schemaResponse.ok) {
      throw new Error(`HTTP error! status: ${schemaResponse.status}`);
    }
    return (await schemaResponse.json()) as string;
  },
  async fetchBulkPackUiSchemaData(branchPath: string) {
    const schemaResponse = await fetch(
      `/config/bulk-pack/${branchPath}/ui-schema`,
    );
    if (!schemaResponse.ok) {
      throw new Error(`HTTP error! status: ${schemaResponse.status}`);
    }
    return (await schemaResponse.json()) as string;
  },
};
