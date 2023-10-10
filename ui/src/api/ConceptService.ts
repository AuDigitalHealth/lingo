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
import { MedicationPackageDetails } from '../types/authoring.ts';

const ConceptService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid concept response');
  },

  async searchConcept(str: string): Promise<Concept[]> {
    let concepts: Concept[] = [];
    const response = await axios.get(
      // `/snowstorm/MAIN/concepts?term=${str}`,
      `/snowstorm/branch/concepts?term=${str}&ecl=%5E%20929360051000036108`,
    );
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

  async searchConceptById(id: string): Promise<Concept[]> {
    const response = await axios.get(`/snowstorm/branch/concepts/${id}`);
    if (response.status != 200) {
      this.handleErrors();
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
    return this.searchConceptByEcl('<767524001');
  },
  async getAllContainerTypes(): Promise<Concept[]> {
    return this.searchConceptByEcl('<706437002');
  },
  async getAllIngredients(): Promise<Concept[]> {
    return this.searchConceptByEcl('<105590001');
  },
  async getAllDoseForms(): Promise<Concept[]> {
    return this.searchConceptByEcl('<736542009');
  },
  async getAllBrandProducts(): Promise<Concept[]> {
    return this.searchConceptByEcl('<774167006');
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
