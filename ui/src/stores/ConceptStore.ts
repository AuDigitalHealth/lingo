import { create } from 'zustand';
import { Concept, ProductSummary } from '../types/concept.ts';
import conceptService from '../api/ConceptService.ts';
import useApplicationConfigStore from './ApplicationConfigStore.ts';
import { UnitEachId, UnitPackId } from '../utils/helpers/conceptUtils.ts';
import {
  BigDecimal,
  BrandWithIdentifiers,
  ProductBrands,
  ProductPackSizes,
} from '../types/product.ts';

interface ConceptStoreConfig {
  fetching: boolean;
  fetchProductModel: (
    conceptId: string | undefined,
  ) => Promise<ProductSummary | undefined | null>;
  activeProduct: Concept | null;
  setActiveProduct: (product: Concept | null) => void;
  defaultUnit: Concept | null;
  setDefaultUnit: (units: Concept | null) => void;

  defaultProductPackSizes: ProductPackSizes;
  setDefaultProductPackSizes: (packSizes: ProductPackSizes) => void;

  defaultProductBrands: ProductBrands;
  setDefaultProductBrands: (brands: ProductBrands) => void;

  fetchDefaultUnit: () => Promise<void>;
  fetchDefaultProductPackSizes: () => Promise<void>;
  fetchDefaultProductBrands: () => Promise<void>;

  unitPack: Concept | null;
  setUnitPack: (units: Concept | null) => void;

  fetchUnitPack: () => Promise<void>;
}

const useConceptStore = create<ConceptStoreConfig>()(set => ({
  fetching: false,
  activeProduct: null,
  defaultProductPackSizes: new (class implements ProductPackSizes {
    packSizes = [] as BigDecimal[];
    productId = '';
    unitOfMeasure = undefined;
  })(),
  defaultUnit: null,
  defaultProductBrands: new (class implements ProductBrands {
    brands = [] as BrandWithIdentifiers[];
    productId = '';
  })(),
  unitPack: null,
  productFieldBindings: undefined,
  setActiveProduct: product => {
    set({ activeProduct: product });
  },
  setDefaultUnit: unit => {
    set({ defaultUnit: unit });
  },
  setDefaultProductPackSizes: packSize => {
    set({ defaultProductPackSizes: packSize });
  },
  setDefaultProductBrands: brand => {
    set({ defaultProductBrands: brand });
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
        useApplicationConfigStore.getState().applicationConfig?.apDefaultBranch,
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
        useApplicationConfigStore.getState().applicationConfig?.apDefaultBranch,
      );
      set({ defaultUnit: tempUnits[0] });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
  },
  fetchDefaultProductBrands: async () => {
    set(() => ({
      fetching: true,
    }));

    try {
      // TODO
      set({
        defaultProductBrands: new (class implements ProductBrands {
          brands = [] as BrandWithIdentifiers[];
          productId = '';
        })(),
      });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
    return Promise.resolve();
  },
  fetchDefaultProductPackSizes: async () => {
    set(() => ({
      fetching: true,
    }));

    try {
      // TODO
      set({
        defaultProductPackSizes: new (class implements ProductPackSizes {
          packSizes = [] as BigDecimal[];
          productId = '';
          unitOfMeasure = undefined;
        })(),
      });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
    return Promise.resolve();
  },
  fetchUnitPack: async () => {
    set(() => ({
      fetching: true,
    }));

    try {
      const tempUnits = await conceptService.searchConceptByIdNoEcl(
        UnitPackId,
        useApplicationConfigStore.getState().applicationConfig?.apDefaultBranch,
      );
      set({ unitPack: tempUnits[0] });
      set({ fetching: false });
    } catch (error) {
      console.log(error);
    }
  },
}));

export default useConceptStore;
