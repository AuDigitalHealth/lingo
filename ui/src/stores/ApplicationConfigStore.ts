import { create } from 'zustand';
import ApplicationConfig from '../types/applicationConfig';
import { FieldBindings } from '../types/FieldBindings.ts';

const emptyApplicationConfig = {
  appName: '',
  imsUrl: '',
  apUrl: '',
  apProjectKey: '',
  apDefaultBranch: '',
  apLanguageHeader: '',
  apApiBaseUrl: '',
  fhirServerBaseUrl: '',
  fhirServerExtension: '',
};
interface ApplicationConfigStoreConfig {
  applicationConfig: ApplicationConfig;
  updateApplicationConfigState: (configState: ApplicationConfig) => void;
  fieldBindings: FieldBindings | null;
  setFieldBindings: (fieldBindings: FieldBindings) => void;
}

const useApplicationConfigStore = create<ApplicationConfigStoreConfig>()(
  set => ({
    applicationConfig: emptyApplicationConfig,
    fieldBindings: null,
    updateApplicationConfigState: (configState: ApplicationConfig) =>
      set(() => ({
        applicationConfig: configState,
      })),
    setFieldBindings: (fieldBindings: FieldBindings) =>
      set(() => ({
        fieldBindings: fieldBindings,
      })),
  }),
);
export default useApplicationConfigStore;
