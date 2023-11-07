import { create } from 'zustand';
import { Concept, ProductModel } from '../types/concept.ts';
import conceptService from '../api/ConceptService.ts';
import { getOrDefaultBranch } from '../utils/helpers/conceptUtils.ts';

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
  ingredients: Concept[];
  setIngredients: (ingredients: Concept[]) => void;
  doseForms: Concept[];
  setDoseForms: (doseForms: Concept[]) => void;
  brandProducts: Concept[];
  deviceBrandProducts: Concept[];
  deviceDeviceTypes: Concept[];
  medicationDeviceTypes: Concept[];
  setDeviceDeviceTypes: (concepts: Concept[]) => void;
  setMedicationDeviceTypes: (concepts: Concept[]) => void;
  setBrandProducts: (brandProducts: Concept[]) => void;
  setDeviceBrandProducts: (brandProducts: Concept[]) => void;
  fetchUnits: () => Promise<void>;
  fetchContainerTypes: () => Promise<void>;
  fetchIngredients: () => Promise<void>;
  fetchDoseForms: () => Promise<void>;
  fetchBrandProducts: () => Promise<void>;
  fetchDeviceBrandProducts: () => Promise<void>;
  fetchDeviceDeviceTypes: () => Promise<void>;
  fetchMedicationDeviceTypes: () => Promise<void>;
}

const useConceptStore = create<ConceptStoreConfig>()(set => ({
  fetching: false,
  activeProduct: null,
  units: [],
  containerTypes: [],
  ingredients: [],
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
  setBrandProducts: (concepts: Concept[]) => {
    set({ brandProducts: [...concepts] });
  },
  setDeviceBrandProducts: (concepts: Concept[]) => {
    set({ deviceBrandProducts: [...concepts] });
  },
  setIngredients: (concepts: Concept[]) => {
    set({ ingredients: [...concepts] });
  },
  setDoseForms: (concepts: Concept[]) => {
    set({ doseForms: [...concepts] });
  },
  setDeviceDeviceTypes: (concepts: Concept[]) => {
    set({ deviceDeviceTypes: [...concepts] });
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
        getOrDefaultBranch(),
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
      const tempUnits = await conceptService.getAllUnits(getOrDefaultBranch());
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
        getOrDefaultBranch(),
      );
      set({ containerTypes: [...tempConcepts] });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
  },
  fetchIngredients: async () => {
    set(() => ({
      fetching: true,
    }));

    try {
      const tempConcepts = await conceptService.getAllIngredients(
        getOrDefaultBranch(),
      );
      set({ ingredients: [...tempConcepts] });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
  },
  fetchDoseForms: async () => {
    set(() => ({
      fetching: true,
    }));

    try {
      const tempConcepts = await conceptService.getAllDoseForms(
        getOrDefaultBranch(),
      );
      set({ doseForms: [...tempConcepts] });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
  },
  fetchBrandProducts: async () => {
    set(() => ({
      fetching: true,
    }));

    try {
      const tempConcepts = await conceptService.getMedicationBrandProducts(
        getOrDefaultBranch(),
      );
      set({ brandProducts: [...tempConcepts] });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
  },
  fetchDeviceBrandProducts: async () => {
    set(() => ({
      fetching: true,
    }));

    try {
      const tempConcepts = await conceptService.getDeviceBrandProducts(
        getOrDefaultBranch(),
      );
      set({ deviceBrandProducts: [...tempConcepts] });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
  },

  fetchDeviceDeviceTypes: async () => {
    set(() => ({
      fetching: true,
    }));

    try {
      const tempConcepts = await conceptService.getDeviceDeviceTypes(
        getOrDefaultBranch(),
      );
      set({ deviceDeviceTypes: [...tempConcepts] });
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
        getOrDefaultBranch(),
      );
      set({ medicationDeviceTypes: [...tempConcepts] });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
  },
}));

export default useConceptStore;
