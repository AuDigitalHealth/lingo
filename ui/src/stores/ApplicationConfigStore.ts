import { create } from 'zustand';
import ApplicationConfig from '../types/applicationConfig';

interface ApplicationConfigStoreConfig {
  applicationConfig: ApplicationConfig | null;
  updateApplicationConfigState: (configState: ApplicationConfig) => void;
}

const useApplicationConfigStore = create<ApplicationConfigStoreConfig>()(
  set => ({
    applicationConfig: null,
    updateApplicationConfigState: (configState: ApplicationConfig) =>
      set(() => ({
        applicationConfig: configState,
      })),
  }),
);

export default useApplicationConfigStore;
