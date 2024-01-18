import { create } from 'zustand';
import ApplicationConfig from '../types/applicationConfig';
import { FieldBindings } from '../types/FieldBindings.ts';

interface ApplicationConfigStoreConfig {
  applicationConfig: ApplicationConfig | null;
  updateApplicationConfigState: (configState: ApplicationConfig) => void;
  fieldBindings: FieldBindings | null;
  setFieldBindings: (fieldBindings: FieldBindings) => void;
}

const useApplicationConfigStore = create<ApplicationConfigStoreConfig>()(
  set => ({
    applicationConfig: null,
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
