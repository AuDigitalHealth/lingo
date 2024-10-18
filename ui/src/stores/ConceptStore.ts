///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import { create } from 'zustand';
import { Concept, ProductSummary } from '../types/concept.ts';
import useApplicationConfigStore from './ApplicationConfigStore.ts';
import {
  BrandWithIdentifiers,
  PackSizeWithIdentifiers,
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
    packSizes = [] as PackSizeWithIdentifiers[];
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
          packSizes = [] as PackSizeWithIdentifiers[];
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
