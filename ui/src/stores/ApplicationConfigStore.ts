import { create } from 'zustand';
import ApplicationConfig from '../types/applicationConfig';

const emptyApplicationConfig = {
  appName: '',
  imsUrl: '',
  apUrl: '',
  apProjectKey: '',
  apDefaultBranch: '',
  apSnodineDefaultBranch: '',
  apLanguageHeader: '',
  apApiBaseUrl: '',
  fhirServerBaseUrl: '',
  fhirServerExtension: '',
  fhirPreferredForLanguage: '',
  fhirRequestCount: '',
  snodineSnowstormProxy: '',
  snodineExtensionModules: [],
};
interface ApplicationConfigStoreConfig {
  applicationConfig: ApplicationConfig;
  updateApplicationConfigState: (configState: ApplicationConfig) => void;
}

const useApplicationConfigStore = create<ApplicationConfigStoreConfig>()(
  set => ({
    applicationConfig: emptyApplicationConfig,
    updateApplicationConfigState: (configState: ApplicationConfig) =>
      set(() => ({
        applicationConfig: configState,
      })),
  }),
);
export default useApplicationConfigStore;
