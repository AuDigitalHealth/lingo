import axios from 'axios';
import {
  Concept,
  ConceptResponse,
  ConceptSearchResponse,
  ProductModel,
} from '../types/concept.ts';
import {
  filterByActiveConcepts,
  mapToConcepts,
} from '../utils/helpers/conceptUtils.ts';
import {
  MedicationPackageDetails,
  MedicationProductDetails,
} from '../types/authoring.ts';
import {
  ECL_BRAND_PRODUCTS,
  ECL_CONTAINER_TYPES,
  ECL_DOSE_FORMS,
  ECL_GENERIC_CONCEPT_SEARCH,
  ECL_INGREDIENTS,
  ECL_UNITS,
} from '../utils/helpers/EclUtils.ts';

const ConceptService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid concept response');
  },

  async searchConcept(str: string, providedEcl?: string): Promise<Concept[]> {
    let concepts: Concept[] = [];
    let ecl = ECL_GENERIC_CONCEPT_SEARCH;
    if (providedEcl) {
      ecl = providedEcl;
    }
    const url = `/snowstorm/branch/concepts?term=${str}&ecl=${ecl}`;
    const response = await axios.get(url);
    if (response.status != 200) {
      this.handleErrors();
    }
    const conceptResponse = response.data as ConceptResponse;
    concepts = conceptResponse.items;
    return concepts;
  },
  async searchConceptByEcl(ecl: string): Promise<Concept[]> {
    let concepts: Concept[] = [];
    const response = await axios.get(
      // `/snowstorm/MAIN/concepts?term=${str}`,
      `/snowstorm/branch/concepts?ecl=${ecl}`,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const conceptResponse = response.data as ConceptResponse;
    concepts = conceptResponse.items;
    const uniqueConcepts = filterByActiveConcepts(concepts);
    return uniqueConcepts;
  },

  async searchConceptById(
    id: string,
    providedEcl?: string,
  ): Promise<Concept[]> {
    const url = providedEcl
      ? `/snowstorm/branch/concepts?conceptIds=${id}&ecl=${providedEcl}`
      : `/snowstorm/branch/concepts/${id}`;
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
  async searchConceptByArtgId(id: string): Promise<Concept[]> {
    const searchBody = {
      additionalFields: {
        schemeValue: id, //need to change to schemeValue
      },
    };
    const response = await axios.post(
      `/snowstorm/branch/members/search`,
      searchBody,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const conceptSearchResponse = response.data as ConceptSearchResponse;
    return mapToConcepts(conceptSearchResponse.items);
  },
  async getAllUnits(): Promise<Concept[]> {
    return this.searchConceptByEcl(ECL_UNITS);
  },
  async getAllContainerTypes(): Promise<Concept[]> {
    return this.searchConceptByEcl(ECL_CONTAINER_TYPES);
  },
  async getAllIngredients(): Promise<Concept[]> {
    return this.searchConceptByEcl(ECL_INGREDIENTS);
  },
  async getAllDoseForms(): Promise<Concept[]> {
    return this.searchConceptByEcl(ECL_DOSE_FORMS);
  },
  async getAllBrandProducts(): Promise<Concept[]> {
    return this.searchConceptByEcl(ECL_BRAND_PRODUCTS);
  },
  async getConceptModel(id: string): Promise<ProductModel> {
    const response = await axios.get(`/api/branch/product-model/${id}`);
    if (response.status != 200) {
      this.handleErrors();
    }
    const productModel = response.data as ProductModel;
    return productModel;
  },
  async fetchMedication(id: string): Promise<MedicationPackageDetails> {
    const response = await axios.get(`/api/branch/medications/${id}`);
    if (response.status != 200) {
      this.handleErrors();
    }
    const medicationPackageDetails = response.data as MedicationPackageDetails;
    return medicationPackageDetails;
  },
  async fetchMedicationProduct(id: string): Promise<MedicationProductDetails> {
    const response = await axios.get(`/api/branch/medications/product/${id}`);
    if (response.status != 200) {
      this.handleErrors();
    }
    const medicationProductDetails = response.data as MedicationProductDetails;
    return medicationProductDetails;
  },
  async fetchDevice(id: string): Promise<ProductModel> {
    const response = await axios.get(`/api/branch/devices/${id}`);
    if (response.status != 200) {
      this.handleErrors();
    }
    const productModel = response.data as ProductModel;
    return productModel;
  },
};

export default ConceptService;
