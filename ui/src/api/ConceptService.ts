import axios from 'axios';
import {
  Concept,
  ConceptResponse,
  ConceptSearchResponse,
  ProductModel,
} from '../types/concept.ts';
import {
  filterByActiveConcepts,
  mapToConceptIds,
} from '../utils/helpers/conceptUtils.ts';
import {
  DevicePackageDetails,
  MedicationPackageDetails,
  MedicationProductDetails,
  ProductCreationDetails,
} from '../types/product.ts';
import { appendIdsToEcl } from '../utils/helpers/EclUtils.ts';
import useApplicationConfigStore from '../stores/ApplicationConfigStore.ts';

const ConceptService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid concept response');
  },

  async searchConcept(
    str: string,
    branch: string,
    providedEcl: string,
  ): Promise<Concept[]> {
    let concepts: Concept[] = [];
    console.log('provided ecl');
    console.log(providedEcl);
    const url = `/snowstorm/${branch}/concepts?term=${str}&ecl=${providedEcl}&termActive=true&`;
    const response = await axios.get(url, {
      headers: {
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }
    const conceptResponse = response.data as ConceptResponse;
    concepts = conceptResponse.items;
    const uniqueConcepts = filterByActiveConcepts(concepts);
    return uniqueConcepts;
  },
  async searchConceptByEcl(
    ecl: string,
    branch: string,
    limit?: number,
    term?: string,
  ): Promise<Concept[]> {
    let concepts: Concept[] = [];
    if (!limit) {
      limit = 50;
    }
    let url = `/snowstorm/${branch}/concepts?ecl=${ecl}&termActive=true&limit=${limit}`;
    if (term && term.length > 2) {
      url += `&term=${term}`;
    }
    const response = await axios.get(
      // `/snowstorm/MAIN/concepts?term=${str}`,
      url,
      {
        headers: {
          'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
        },
      },
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const conceptResponse = response.data as ConceptResponse;
    concepts = conceptResponse.items;
    const uniqueConcepts = filterByActiveConcepts(concepts);
    return uniqueConcepts;
  },

  async searchConceptByIds(
    id: string[],
    branch: string,
    providedEcl?: string,
  ): Promise<Concept[]> {
    if (providedEcl) {
      providedEcl = appendIdsToEcl(providedEcl, id);
    }
    const url = providedEcl
      ? `/snowstorm/${branch}/concepts?statedEcl=${providedEcl}&termActive=true`
      : `/snowstorm/${branch}/concepts/${id[0]}`;
    const response = await axios.get(url, {
      headers: {
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }
    if (providedEcl) {
      const conceptResponse = response.data as ConceptResponse;
      return conceptResponse.items;
    }
    const concepts = [response.data as Concept];
    const uniqueConcepts = filterByActiveConcepts(concepts);
    return uniqueConcepts;
  },
  async searchConceptsByIdsList(ids: string[], branch: string): Promise<ConceptResponse> {
    
    const conceptsSearchTerms = ids.join(" OR ");

    const ecl2 = `(^929360051000036108) AND ((<< (${conceptsSearchTerms})) OR (* : (774160008 OR 999000081000168101) = (* : <<127489000 = << (${conceptsSearchTerms}))) OR (* : (774160008 OR 999000081000168101) = (* : <<732943007 = << (${conceptsSearchTerms}))) OR (* : (774160008 OR 999000081000168101) = << (${conceptsSearchTerms})) OR (* : (999000011000168107 OR 999000111000168106) = << (${conceptsSearchTerms})) OR (* : (999000011000168107 OR 999000111000168106) = (* : (774160008 OR 999000081000168101) = << (${conceptsSearchTerms}))) OR (* : (999000011000168107 OR 999000111000168106) = (* : (774160008 OR 999000081000168101) = (* : <<127489000 = << (${conceptsSearchTerms})))) OR (* : (999000011000168107 OR 999000111000168106) = (* : (774160008 OR 999000081000168101) = (* : <<732943007 = << (${conceptsSearchTerms})))) OR (* : 774158006 = (${conceptsSearchTerms})) OR (* : (774160008 OR 999000081000168101) = (* : 774158006 = (${conceptsSearchTerms}))) OR (* : (999000011000168107 OR 999000111000168106) = (* : 774158006 = (${conceptsSearchTerms}))) OR (* : (999000011000168107 OR 999000111000168106) = (* : (774160008 OR 999000081000168101) = (* : 774158006 = (${conceptsSearchTerms})))))`
    // const ecl2WithoutComments = ecl2.replace(/\/\*[\s\S]*?\*\//g, '');
    // const ecl2WithoutWhitespace = ecl2WithoutComments.replace(/\s/g, '');

    // console.log(conceptsSearchTerms);
    // const ecl = `(^929360051000036108) AND ((<< (${conceptsSearchTerms})) OR (* : (774160008 OR 999000081000168101) = (* : <<127489000 = << (${conceptsSearchTerms})) OR (* : (774160008 OR 999000081000168101) = (* : <<732943007 = << (${conceptsSearchTerms}))) OR (* : (774160008 OR 999000081000168101) = << (${conceptsSearchTerms})) OR (* : (999000011000168107 OR 999000111000168106) = << (${conceptsSearchTerms})) OR (* : (999000011000168107 OR 999000111000168106) = (* : (774160008 OR 999000081000168101) = << (${conceptsSearchTerms}))) OR (* : (999000011000168107 OR 999000111000168106) = (* : (774160008 OR 999000081000168101) = (* : <<127489000 = << (${conceptsSearchTerms})))) OR (* : (999000011000168107 OR 999000111000168106) = (* : (774160008 OR 999000081000168101) = (* : <<732943007 = << (${conceptsSearchTerms})))) OR (* : 774158006 = (${conceptsSearchTerms})) OR (* : (774160008 OR 999000081000168101) = (* : 774158006 = (${conceptsSearchTerms}))) OR (* : (999000011000168107 OR 999000111000168106) = (* : 774158006 = (${conceptsSearchTerms}))) OR (* : (999000011000168107 OR 999000111000168106) = (* : (774160008 OR 999000081000168101) = (* : 774158006 = (${conceptsSearchTerms})))))`
    console.log(ecl2);
    
    const encodedEcl = encodeURIComponent(ecl2);
    console.log(encodedEcl);
    const url = `/snowstorm/${branch}/concepts?ecl=${encodedEcl}`;
    const response = await axios.get(url, {
      headers: {
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as ConceptResponse;
  },
  async searchConceptByArtgId(
    id: string,
    branch: string,
    providedEcl?: string,
  ): Promise<Concept[]> {
    const searchBody = {
      additionalFields: {
        mapTarget: id, //need to change to schemeValue
      },
    };
    const response = await axios.post(
      `/snowstorm/${branch}/members/search`,
      searchBody,
      {
        headers: {
          'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
        },
      },
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const conceptSearchResponse = response.data as ConceptSearchResponse;
    const conceptIds = mapToConceptIds(conceptSearchResponse.items);
    if (conceptIds.length > 0) {
      return this.searchConceptByIds(conceptIds, branch, providedEcl);
    }
    return [];
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
    productCreationDetails: ProductCreationDetails,
    branch: string,
  ): Promise<ProductModel> {
    const response = await axios.post(
      `/api/${branch}/medications/product`,
      productCreationDetails,
    );
    if (response.status != 201 && response.status != 422) {
      this.handleErrors();
    }
    const productModel = response.data as ProductModel;
    return productModel;
  },
};

export default ConceptService;
