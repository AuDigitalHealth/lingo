import { create } from 'zustand';
import { Concept, ProductSummary } from '../types/concept.ts';
import useApplicationConfigStore from './ApplicationConfigStore.ts';
import {
  BigDecimal,
  BrandWithIdentifiers,
  ProductBrands,
  ProductPackSizes,
} from '../types/product.ts';
import productService from '../api/ProductService.ts';

interface ConceptStoreConfig {
  fetching: boolean;
  fetchProductModel: (
    conceptId: string | undefined,
  ) => Promise<ProductSummary | undefined | null>;
  activeProduct: Concept | null;
  setActiveProduct: (product: Concept | null) => void;
  defaultProductPackSizes: ProductPackSizes;
  setDefaultProductPackSizes: (packSizes: ProductPackSizes) => void;
  defaultProductBrands: ProductBrands;
  setDefaultProductBrands: (brands: ProductBrands) => void;
  fetchDefaultProductPackSizes: () => Promise<void>;
  fetchDefaultProductBrands: () => Promise<void>;
}

const useConceptStore = create<ConceptStoreConfig>()(set => ({
  fetching: false,
  activeProduct: null,
  defaultProductPackSizes: new (class implements ProductPackSizes {
    packSizes = [] as BigDecimal[];
    productId = '';
    unitOfMeasure = undefined;
  })(),
  defaultProductBrands: new (class implements ProductBrands {
    brands = [] as BrandWithIdentifiers[];
    productId = '';
  })(),
  productFieldBindings: undefined,
  setActiveProduct: product => {
    set({ activeProduct: product });
  },
  setDefaultProductPackSizes: packSize => {
    set({ defaultProductPackSizes: packSize });
  },
  setDefaultProductBrands: brand => {
    set({ defaultProductBrands: brand });
  },
  fetchProductModel: async (conceptId: string | undefined) => {
    if (conceptId === undefined) {
      return null;
    }
    set(() => ({
      fetching: true,
    }));

    try {
      const tempProductModel = await productService.getProductModel(
        conceptId,
        useApplicationConfigStore.getState().applicationConfig?.apDefaultBranch,
      );
      //set({ productModel: tempProductModel });
      return tempProductModel;
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
}));

export default useConceptStore;
