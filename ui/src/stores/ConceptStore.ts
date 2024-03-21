import { create } from 'zustand';
import { Concept, ProductModel } from '../types/concept.ts';
import conceptService from '../api/ConceptService.ts';
import useApplicationConfigStore from './ApplicationConfigStore.ts';
import { UnitEachId, UnitPackId } from '../utils/helpers/conceptUtils.ts';

interface ConceptStoreConfig {
  fetching: boolean;
  fetchProductModel: (
    conceptId: string | undefined,
  ) => Promise<ProductModel | undefined | null>;
  activeProduct: Concept | null;
  setActiveProduct: (product: Concept | null) => void;
  defaultUnit: Concept | null;
  setDefaultUnit: (units: Concept | null) => void;

  fetchDefaultUnit: () => Promise<void>;

  unitPack: Concept | null;
  setUnitPack: (units: Concept | null) => void;

  fetchUnitPack: () => Promise<void>;
}

const useConceptStore = create<ConceptStoreConfig>()(set => ({
  fetching: false,
  activeProduct: null,
  defaultUnit: null,
  unitPack: null,
  productFieldBindings: undefined,
  setActiveProduct: product => {
    set({ activeProduct: product });
  },
  setDefaultUnit: unit => {
    set({ defaultUnit: unit });
  },
  setUnitPack: unit => {
    set({ unitPack: unit });
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
  fetchDefaultUnit: async () => {
    set(() => ({
      fetching: true,
    }));

    try {
      const tempUnits = await conceptService.searchConceptByIdNoEcl(
        UnitEachId,
        useApplicationConfigStore.getState().applicationConfig
          ?.apDefaultBranch as string,
      );
      set({ defaultUnit: tempUnits[0] });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
  },
  fetchUnitPack: async () => {
    set(() => ({
      fetching: true,
    }));

    try {
      const tempUnits = await conceptService.searchConceptByIdNoEcl(
        UnitPackId,
        useApplicationConfigStore.getState().applicationConfig
          ?.apDefaultBranch as string,
      );
      set({ unitPack: tempUnits[0] });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
  },
}));

export default useConceptStore;
