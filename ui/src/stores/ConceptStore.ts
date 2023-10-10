import { create } from 'zustand';
import { Concept, ProductModel } from '../types/concept.ts';
import conceptService from '../api/ConceptService.ts';

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
  setBrandProducts: (brandProducts: Concept[]) => void;
  fetchUnits: () => Promise<void>;
  fetchContainerTypes: () => Promise<void>;
  fetchIngredients: () => Promise<void>;
  fetchDoseForms: () => Promise<void>;
  fetchBrandProducts: () => Promise<void>;
}

const useConceptStore = create<ConceptStoreConfig>()(set => ({
  fetching: false,
  activeProduct: null,
  units: [],
  containerTypes: [],
  ingredients: [],
  doseForms: [],
  brandProducts: [],
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
  setIngredients: (concepts: Concept[]) => {
    set({ ingredients: [...concepts] });
  },
  setDoseForms: (concepts: Concept[]) => {
    set({ doseForms: [...concepts] });
  },
  fetchProductModel: async (conceptId: string | undefined) => {
    if (conceptId === undefined) {
      return null;
    }
    set(() => ({
      fetching: true,
    }));

    try {
      const tempProductModel = await conceptService.getConceptModel(conceptId);
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
      const tempUnits = await conceptService.getAllUnits();
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
      const tempConcepts = await conceptService.getAllContainerTypes();
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
      const tempConcepts = await conceptService.getAllIngredients();
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
      const tempConcepts = await conceptService.getAllDoseForms();
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
      const tempConcepts = await conceptService.getAllBrandProducts();
      set({ brandProducts: [...tempConcepts] });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
  },
}));

export default useConceptStore;
