import {
  Concept,
  ConceptResponse,
  ConceptSearchResponse,
  ProductSummary,
} from '../types/concept.ts';
import {
  emptySnowstormResponse,
  filterByActiveConcepts,
  mapToConceptIds,
} from '../utils/helpers/conceptUtils.ts';
import {
  BrandPackSizeCreationDetails,
  BulkProductCreationDetails,
  DevicePackageDetails,
  DeviceProductDetails,
  MedicationPackageDetails,
  MedicationProductDetails,
  ProductBrands,
  ProductCreationDetails,
  ProductPackSizes,
} from '../types/product.ts';
import {
  appendIdsToEcl,
  generateEclFromBinding,
} from '../utils/helpers/EclUtils.ts';
import useApplicationConfigStore from '../stores/ApplicationConfigStore.ts';
import { FieldBindings } from '../types/FieldBindings.ts';
import { api } from './api.ts';

const ConceptService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid concept response');
  },

  async searchConcept(
    str: string,
    branch: string,
    providedEcl: string,
  ): Promise<ConceptResponse> {
    let concepts: Concept[] = [];

    const url = `/snowstorm/${branch}/concepts?term=${str}&statedEcl=${providedEcl}&termActive=true&isPublished=false`;
    const response = await api.get(url, {
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
    conceptResponse.items = uniqueConcepts;
    return conceptResponse;
  },
  async searchConceptByEcl(
    ecl: string,
    branch: string,
    limit?: number,
    term?: string,
    useOldConcepts?: boolean,
  ): Promise<ConceptResponse> {
    let concepts: Concept[] = [];
    if (!limit) {
      limit = 50;
    }
    let url = `/snowstorm/${branch}/concepts?statedEcl=${ecl}&termActive=true&limit=${limit}${useOldConcepts ? '' : '&isPublished=false'}`;
    if (term && term.length > 2) {
      url += `&term=${term}`;
    }
    const response = await api.get(
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
    conceptResponse.items = uniqueConcepts;
    return conceptResponse;
  },

  async searchConceptByIds(
    id: string[],
    branch: string,
    providedEcl?: string,
  ): Promise<ConceptResponse> {
    if (providedEcl) {
      providedEcl = appendIdsToEcl(providedEcl, id);
    }
    const url = providedEcl
      ? `/snowstorm/${branch}/concepts?statedEcl=${providedEcl}&termActive=true&isPublished=false`
      : `/snowstorm/${branch}/concepts/${id[0]}`;
    const response = await api.get(url, {
      headers: {
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }

    if (providedEcl) {
      const conceptResponse = response.data as ConceptResponse;
      return conceptResponse;
    } else {
      const concept = response.data as Concept;
      const conceptResponse = createConceptResponse([concept]);
      return conceptResponse;
    }
  },

  async searchConceptById(id: string, branch: string): Promise<Concept> {
    const url = `/snowstorm/browser/${branch}/concepts/${id}`;
    const response = await api.get(url, {
      headers: {
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as Concept;
  },

  async searchConceptByIdNoEcl(id: string, branch: string): Promise<Concept[]> {
    const url = `/snowstorm/${branch}/concepts/${id[0]}`;
    const response = await api.get(url, {
      headers: {
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }

    const concepts = response.data as Concept;
    const uniqueConcepts = filterByActiveConcepts([concepts]);

    return uniqueConcepts;
  },
  async searchConceptsByIdsList(
    ids: string[],
    branch: string,
    fieldBindings: FieldBindings,
  ): Promise<ConceptResponse> {
    const conceptsSearchTerms = ids.join(' OR ');
    let ecl = generateEclFromBinding(fieldBindings, 'product.search.ctpp');

    const eclSplit = ecl.split('[values]');
    ecl = eclSplit.join(conceptsSearchTerms);

    const encodedEcl = encodeURIComponent(ecl);
    const url = `/snowstorm/${branch}/concepts?statedEcl=${encodedEcl}&isPublished=false`;
    const response = await api.get(url, {
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
    providedEcl: string,
  ): Promise<ConceptResponse> {
    const searchBody = {
      additionalFields: {
        mapTarget: id, //need to change to schemeValue
      },
    };
    const response = await api.post(
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
    if (conceptIds && conceptIds.length > 0) {
      return this.searchConceptByIds(conceptIds, branch, providedEcl);
    }
    return emptySnowstormResponse;
  },

  async getConceptModel(id: string, branch: string): Promise<ProductSummary> {
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

  async previewNewMedicationProduct(
    medicationPackage: MedicationPackageDetails,
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
  async createNewMedicationProduct(
    productCreationDetails: ProductCreationDetails,
    branch: string,
  ): Promise<ProductSummary> {
    const response = await api.post(
      `/api/${branch}/medications/product`,
      productCreationDetails,
    );
    if (response.status != 201 && response.status != 422) {
      this.handleErrors();
    }
    const productModel = response.data as ProductSummary;
    return productModel;
  },
  async createDeviceProduct(
    productCreationDetails: ProductCreationDetails,
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
    productCreationDetails: ProductCreationDetails,
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

  // ECL refset tool
  async getEclConcepts(
    branch: string,
    ecl: string,
    options?: {
      limit?: number;
      offset?: number;
      term?: string;
      activeFilter?: boolean;
    },
  ): Promise<ConceptResponse> {
    const { term, activeFilter } = options ?? {};
    let { limit, offset } = options ?? {};
    limit = limit || 50;
    offset = offset || 0;

    const url = `/snowstorm/${branch}/concepts`;
    const params: Record<string, string | number | boolean> = {
      ecl: ecl,
      includeLeafFlag: false,
      form: 'inferred',
      offset: offset,
      limit: limit,
    };
    if (activeFilter !== undefined) {
      params.activeFilter = activeFilter;
    }
    if (term && term.length > 2) {
      params.term = term;
    }

    const response = await api.get(url, {
      params: params,
      headers: {
        Accept: 'application/json',
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }
    const conceptResponse = response.data as ConceptResponse;
    return conceptResponse;
  },
};

const createConceptResponse = (concepts: Concept[]) => {
  const conceptResponse = {
    items: concepts,
    total: concepts.length,
    limit: concepts.length, // Assuming all items are returned at once
    offset: 0, // Assuming no pagination is applied
    searchAfter: '', // Provide appropriate values if needed
    searchAfterArray: [], // Provide appropriate values if needed
  };
  return conceptResponse;
};

export default ConceptService;
