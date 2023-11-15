import axios from 'axios';
import {
  Concept,
  ConceptResponse,
  ConceptSearchResponse,
  ProductModel,
} from '../types/concept.ts';
import { mapToConcepts } from '../utils/helpers/conceptUtils.ts';
import {
  DevicePackageDetails,
  MedicationPackageDetails,
  MedicationProductDetails,
} from '../types/product.ts';
import {
  ECL_BRAND_PRODUCTS,
  ECL_CONTAINER_TYPES,
  ECL_DOSE_FORMS,
  ECL_DEFAULT_CONCEPT_SEARCH,
  ECL_INGREDIENTS,
  ECL_UNITS,
  ECL_DEVICE_CONCEPT_SEARCH,
  ECL_DEVICE_TYPE,
  ECL_MEDICATION_DEVICE_TYPE,
} from '../utils/helpers/EclUtils.ts';

const ConceptService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid concept response');
  },

  async searchConcept(
    str: string,
    branch: string,
    providedEcl?: string,
  ): Promise<Concept[]> {
    console.log(branch);
    let concepts: Concept[] = [];
    let ecl = ECL_DEFAULT_CONCEPT_SEARCH;
    if (providedEcl) {
      ecl = providedEcl;
    }
    const url = `/snowstorm/${branch}/concepts?term=${str}&ecl=${ecl}&activeFilter=true&termActive=true`;
    const response = await axios.get(url);
    if (response.status != 200) {
      this.handleErrors();
    }
    const conceptResponse = response.data as ConceptResponse;
    concepts = conceptResponse.items;
    return concepts;
  },
  async searchConceptByEcl(
    ecl: string,
    branch: string,
    limit?: number,
  ): Promise<Concept[]> {
    let concepts: Concept[] = [];
    if (!limit) {
      limit = 50;
    }
    const response = await axios.get(
      // `/snowstorm/MAIN/concepts?term=${str}`,
      `/snowstorm/${branch}/concepts?ecl=${ecl}&activeFilter=true&termActive=true&limit=${limit}`,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const conceptResponse = response.data as ConceptResponse;
    concepts = conceptResponse.items;
    return concepts;
  },

  async searchConceptById(
    id: string,
    branch: string,
    providedEcl?: string,
  ): Promise<Concept[]> {
    if (providedEcl) {
      providedEcl += ` and ${id}`;
    }
    const url = providedEcl
      ? `/snowstorm/${branch}/concepts?ecl=${providedEcl}&activeFilter=true&termActive=true`
      : `/snowstorm/${branch}/concepts/${id}`;
    const response = await axios.get(url);
    if (response.status != 200) {
      this.handleErrors();
    }
    if (providedEcl) {
      const conceptResponse = response.data as ConceptResponse;
      return conceptResponse.items;
    }
    const concept = [response.data as Concept];
    return concept;
  },
  async searchConceptByArtgId(id: string, branch: string): Promise<Concept[]> {
    const searchBody = {
      additionalFields: {
        schemeValue: id, //need to change to schemeValue
      },
    };
    const response = await axios.post(
      `/snowstorm/${branch}/members/search`,
      searchBody,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const conceptSearchResponse = response.data as ConceptSearchResponse;
    return mapToConcepts(conceptSearchResponse.items);
  },
  async getAllUnits(branch: string): Promise<Concept[]> {
    return this.searchConceptByEcl(ECL_UNITS, branch, 100);
  },
  async getAllContainerTypes(branch: string): Promise<Concept[]> {
    return this.searchConceptByEcl(ECL_CONTAINER_TYPES, branch);
  },
  async getAllIngredients(branch: string): Promise<Concept[]> {
    return this.searchConceptByEcl(ECL_INGREDIENTS, branch);
  },
  async getAllDoseForms(branch: string): Promise<Concept[]> {
    return this.searchConceptByEcl(ECL_DOSE_FORMS, branch);
  },
  async getMedicationBrandProducts(branch: string): Promise<Concept[]> {
    return this.searchConceptByEcl(ECL_BRAND_PRODUCTS, branch);
  },
  async getDeviceBrandProducts(branch: string): Promise<Concept[]> {
    return this.searchConceptByEcl(ECL_DEVICE_CONCEPT_SEARCH, branch);
  },
  async getDeviceDeviceTypes(branch: string): Promise<Concept[]> {
    return this.searchConceptByEcl(ECL_DEVICE_TYPE, branch);
  },
  async getMedicationDeviceTypes(branch: string): Promise<Concept[]> {
    return this.searchConceptByEcl(ECL_MEDICATION_DEVICE_TYPE, branch);
  },
  async getConceptModel(id: string, branch: string): Promise<ProductModel> {
    const response = await axios.get(`/api/${branch}/product-model/${id}`);
    if (response.status != 200) {
      this.handleErrors();
    }
    const productModel = response.data as ProductModel;
    return productModel;
  },
  async fetchMedication(
    id: string,
    branch: string,
  ): Promise<MedicationPackageDetails> {
    const response = await axios.get(`/api/${branch}/medications/${id}`);
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
    const response = await axios.get(
      `/api/${branch}/medications/product/${id}`,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const medicationProductDetails = response.data as MedicationProductDetails;
    return medicationProductDetails;
  },
  async fetchDevice(id: string, branch: string): Promise<DevicePackageDetails> {
    const response = await axios.get(`/api/${branch}/devices/${id}`);
    if (response.status != 200) {
      this.handleErrors();
    }
    const productModel = response.data as DevicePackageDetails;
    return productModel;
  },

  async previewNewMedicationProduct(
    medicationPackage: MedicationPackageDetails,
    branch: string,
  ): Promise<ProductModel> {
    const response = await axios.post(
      `/api/${branch}/medications/product/$calculate`,
      medicationPackage,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const productModel = response.data as ProductModel;
    return productModel;
  },
  async createNewProduct(
    productModelRequest: ProductModel,
    branch: string,
  ): Promise<ProductModel> {
    const response = await axios.post(
      `/api/${branch}/medications/product`,
      productModelRequest,
    );
    if (response.status != 201 && response.status != 422) {
      this.handleErrors();
    }
    const productModel = response.data as ProductModel;
    return productModel;
  },
};

export default ConceptService;
