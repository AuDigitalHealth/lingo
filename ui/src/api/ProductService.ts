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

import { Product } from '../types/concept.ts';
import { Concept, ProductSummary } from '../types/concept.ts';

import {
  BrandPackSizeCreationDetails,
  BulkProductCreationDetails,
  DevicePackageDetails,
  DeviceProductDetails,
  MedicationPackageDetails,
  MedicationProductDetails,
  NonDefiningProperty,
  ProductActionType,
  ProductBrands,
  ProductSaveDetails,
  ProductDescriptionUpdateRequest,
  ProductNonDefiningPropertyUpdateRequest,
  ProductPackSizes,
} from '../types/product.ts';

import { api } from './api.ts';

const ProductService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid product response');
  },
  async getNode(conceptId: string, branch: string): Promise<Product> {
    const response = await api.get(`/api/${branch}/node/${conceptId}`);
    if (response.status != 200) {
      this.handleErrors();
    }
    const productModel = response.data as Product;
    return productModel;
  },
  async getProductModel(id: string, branch: string): Promise<ProductSummary> {
    const response = await api.get(`/api/${branch}/product-model/${id}`);
    if (response.status != 200) {
      this.handleErrors();
    }
    const productModel = response.data as ProductSummary;
    return productModel;
  },
  async fetchMedication(
    id: string,
    branch: string,
  ): Promise<MedicationPackageDetails> {
    const response = await api.get(`/api/${branch}/medications/${id}`);
    if (response.status != 200) {
      this.handleErrors();
    }
    const medicationPackageDetails = response.data as MedicationPackageDetails;
    return medicationPackageDetails;
  },
  async fetchMedicationProduct(
    id: string,
    branch: string,
  ): Promise<MedicationProductDetails> {
    const response = await api.get(`/api/${branch}/medications/product/${id}`);
    if (response.status != 200) {
      this.handleErrors();
    }
    const medicationProductDetails = response.data as MedicationProductDetails;
    return medicationProductDetails;
  },
  async fetchDevice(id: string, branch: string): Promise<DevicePackageDetails> {
    const response = await api.get(`/api/${branch}/devices/${id}`);
    if (response.status != 200) {
      this.handleErrors();
    }
    const productModel = response.data as DevicePackageDetails;
    return productModel;
  },

  async fetchDeviceProduct(
    id: string,
    branch: string,
  ): Promise<DeviceProductDetails> {
    const response = await api.get(`/api/${branch}/devices/product/${id}`);
    if (response.status != 200) {
      this.handleErrors();
    }
    const deviceProductDetails = response.data as DeviceProductDetails;
    return deviceProductDetails;
  },

  async previewCreateMedicationProduct(
    medicationPackage: MedicationProductDetails,
    branch: string,
  ): Promise<ProductSummary> {
    const response = await api.post(
      `/api/${branch}/medications/product/$calculate`,
      medicationPackage,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const productModel = response.data as ProductSummary;
    return productModel;
  },
  async previewUpdateMedicationProduct(
    medicationPackage: MedicationProductDetails,
    productId: string | undefined,
    branch: string,
  ): Promise<ProductSummary> {
    const response = await api.post(
      `/api/${branch}/medications/product/${productId}/$calculateUpdate`,
      medicationPackage,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const productModel = response.data as ProductSummary;
    return productModel;
  },
  async saveMedicationProduct(
    productCreationDetails: ProductSaveDetails,
    branch: string,
  ): Promise<ProductSummary> {
    let response;

    if (productCreationDetails.type === ProductActionType.update) {
      // Update existing product
      response = await api.put(
        `/api/${branch}/medications/product/${productCreationDetails.originalConceptId}`,
        productCreationDetails,
      );
      if (response.status !== 200 && response.status !== 422) {
        this.handleErrors();
      }
    } else {
      // Create new product
      response = await api.post(
        `/api/${branch}/medications/product`,
        productCreationDetails,
      );
      if (response.status !== 201 && response.status !== 422) {
        this.handleErrors();
      }
    }

    const productModel = response.data as ProductSummary;
    return productModel;
  },
  async createDeviceProduct(
    productCreationDetails: ProductSaveDetails,
    branch: string,
  ): Promise<ProductSummary> {
    const response = await api.post(
      `/api/${branch}/devices/product`,
      productCreationDetails,
    );
    if (response.status != 201 && response.status != 422) {
      this.handleErrors();
    }
    const productModel = response.data as ProductSummary;
    return productModel;
  },
  async previewNewDeviceProduct(
    devicePackageDetails: DevicePackageDetails,
    branch: string,
  ): Promise<ProductSummary> {
    const response = await api.post(
      `/api/${branch}/devices/product/$calculate`,
      devicePackageDetails,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const productModel = response.data as ProductSummary;
    return productModel;
  },
  async createNewDeviceProduct(
    productCreationDetails: ProductSaveDetails,
    branch: string,
  ): Promise<ProductSummary> {
    const response = await api.post(
      `/api/${branch}/devices/product`,
      productCreationDetails,
    );
    if (response.status != 201 && response.status != 422) {
      this.handleErrors();
    }
    const productModel = response.data as ProductSummary;
    return productModel;
  },
  async getMedicationProductPackSizes(
    productId: string,
    branch: string,
  ): Promise<ProductPackSizes> {
    const response = await api.get(
      `/api/${branch}/medications/${productId}/pack-sizes`,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const productPackSizes = response.data as ProductPackSizes;
    return productPackSizes;
  },
  async getMedicationProductBrands(
    productId: string,
    branch: string,
  ): Promise<ProductBrands> {
    const response = await api.get(
      `/api/${branch}/medications/${productId}/brands`,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const productBrands = response.data as ProductBrands;
    return productBrands;
  },
  async previewNewMedicationBrandPackSizes(
    brandPackSizeCreationDetails: BrandPackSizeCreationDetails,
    branch: string,
  ): Promise<ProductSummary> {
    const response = await api.post(
      `/api/${branch}/medications/product/$calculateNewBrandPackSizes`,
      brandPackSizeCreationDetails,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const productModel = response.data as ProductSummary;
    return productModel;
  },
  async createNewMedicationBrandPackSizes(
    creationDetails: BulkProductCreationDetails,
    branch: string,
  ): Promise<ProductSummary> {
    const response = await api.post(
      `/api/${branch}/medications/product/new-brand-pack-sizes`,
      creationDetails,
    );
    if (response.status != 201 && response.status != 422) {
      this.handleErrors();
    }
    const productModel = response.data as ProductSummary;
    return productModel;
  },
  async previewNewDeviceBrandPackSizes(
    brandPackSizeCreationDetails: BrandPackSizeCreationDetails,
    branch: string,
  ): Promise<ProductSummary> {
    const response = await api.post(
      `/api/${branch}/devices/product/$calculateNewBrandPackSizes`,
      brandPackSizeCreationDetails,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const productModel = response.data as ProductSummary;
    return productModel;
  },
  async createNewDeviceBrandPackSizes(
    creationDetails: BrandPackSizeCreationDetails,
    branch: string,
  ): Promise<ProductSummary> {
    const response = await api.post(
      `/api/${branch}/devices/product/new-brand-pack-sizes`,
      creationDetails,
    );
    if (response.status != 201 && response.status != 422) {
      this.handleErrors();
    }
    const productModel = response.data as ProductSummary;
    return productModel;
  },
  async editProductDescriptions(
    productUpdateRequest: ProductDescriptionUpdateRequest,
    productId: string,
    branch: string,
  ): Promise<Concept> {
    const response = await api.put(
      `/api/${branch}/product-model/${productId}/descriptions`,
      productUpdateRequest,
    );
    if (response.status != 200 && response.status != 422) {
      this.handleErrors();
    }
    const concept = response.data as Concept;
    return concept;
  },
  async editProductNonDefiningProperties(
    externalRequesterUpdate: ProductNonDefiningPropertyUpdateRequest,
    productId: string,
    branch: string,
  ): Promise<NonDefiningProperty[]> {
    const response = await api.put(
      `/api/${branch}/product-model/${productId}/properties`,
      externalRequesterUpdate,
    );
    if (response.status != 200 && response.status != 422) {
      this.handleErrors();
    }
    const result = response.data as NonDefiningProperty[];
    return result;
  },
};
export default ProductService;
