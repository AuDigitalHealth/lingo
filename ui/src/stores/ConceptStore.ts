import { create } from 'zustand';
import { Concept, ProductModel } from '../types/concept.ts';
import conceptService from '../api/ConceptService.ts';
import useApplicationConfigStore from './ApplicationConfigStore.ts';

interface ConceptStoreConfig {
  fetching: boolean;
  fetchProductModel: (
    conceptId: string | undefined,
  ) => Promise<ProductModel | undefined | null>;
  activeProduct: Concept | null;
  setActiveProduct: (product: Concept | null) => void;
  units: Concept[];
  setUnits: (units: Concept[]) => void;
  containerTypes: Concept[];
  setContainerTypes: (containerTypes: Concept[]) => void;

  medicationDeviceTypes: Concept[];

  setMedicationDeviceTypes: (concepts: Concept[]) => void;

  fetchUnits: () => Promise<void>;
  fetchContainerTypes: () => Promise<void>;
  fetchMedicationDeviceTypes: () => Promise<void>;
}

const useConceptStore = create<ConceptStoreConfig>()(set => ({
  fetching: false,
  activeProduct: null,
  units: [],
  containerTypes: [],
  doseForms: [],
  brandProducts: [],
  deviceBrandProducts: [],
  deviceDeviceTypes: [],
  medicationDeviceTypes: [],
  setActiveProduct: product => {
    set({ activeProduct: product });
  },
  setUnits: (units: Concept[]) => {
    set({ units: [...units] });
  },
  setContainerTypes: (concepts: Concept[]) => {
    set({ containerTypes: [...concepts] });
  },

  setMedicationDeviceTypes: (concepts: Concept[]) => {
    set({ medicationDeviceTypes: [...concepts] });
  },
  fetchProductModel: async (conceptId: string | undefined) => {
    if (conceptId === undefined) {
      return null;
    }
    set(() => ({
      fetching: true,
    }));

    try {
      const tempProductModel = await conceptService.getConceptModel(
        conceptId,
        useApplicationConfigStore.getState().applicationConfig
          ?.apDefaultBranch as string,
      );
      //set({ productModel: tempProductModel });
      return tempProductModel;
    } catch (error) {
      console.log(error);
    }
  },
  fetchUnits: async () => {
    set(() => ({
      fetching: true,
    }));

    try {
      const tempUnits = await conceptService.getAllUnits(
        useApplicationConfigStore.getState().applicationConfig
          ?.apDefaultBranch as string,
      );
      set({ units: [...tempUnits] });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
  },
  fetchContainerTypes: async () => {
    set(() => ({
      fetching: true,
    }));

    try {
      const tempConcepts = await conceptService.getAllContainerTypes(
        useApplicationConfigStore.getState().applicationConfig
          ?.apDefaultBranch as string,
      );
      set({ containerTypes: [...tempConcepts] });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
  },

  fetchMedicationDeviceTypes: async () => {
    set(() => ({
      fetching: true,
    }));

    try {
      const tempConcepts = await conceptService.getMedicationDeviceTypes(
        useApplicationConfigStore.getState().applicationConfig
          ?.apDefaultBranch as string,
      );
      set({ medicationDeviceTypes: [...tempConcepts] });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
  },
}));

export default useConceptStore;
