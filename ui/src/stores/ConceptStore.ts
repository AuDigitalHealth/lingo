import { create } from 'zustand';
import { ProductModel } from '../types/concept.ts';
import conceptService from '../api/ConceptService.ts';

interface ConceptStoreConfig {
  fetching: boolean;
  fetchProductModel: (
    conceptId: string | undefined,
  ) => Promise<ProductModel | undefined | null>;
}

const useConceptStore = create<ConceptStoreConfig>()(set => ({
  fetching: false,
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
}));

export default useConceptStore;
