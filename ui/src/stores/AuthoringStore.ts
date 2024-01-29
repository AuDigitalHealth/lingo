import { create } from 'zustand';
import { Concept } from '../types/concept.ts';
import {
  MedicationPackageDetails,
  ProductCreationDetails,
  ProductType,
} from '../types/product.ts';
import { snowstormErrorHandler } from '../types/ErrorHandler.ts';
import ConceptService from '../api/ConceptService.ts';
import { cleanPackageDetails } from '../utils/helpers/conceptUtils.ts';
import { Ticket } from '../types/tickets/ticket.ts';
import { ServiceStatus } from '../types/applicationConfig.ts';

interface AuthoringStoreConfig {
  selectedProduct: Concept | null;
  setSelectedProduct: (concept: Concept | null) => void;
  selectedProductType: ProductType;
  setSelectedProductType: (productType: ProductType) => void;
  isLoadingProduct: boolean;
  setIsLoadingProduct: (bool: boolean) => void;
  formContainsData: boolean;
  setFormContainsData: (bool: boolean) => void;
  handleSelectedProductChange: (
    concept: Concept | null,
    productType: ProductType,
  ) => void;
  handleClearForm: () => void;
  searchInputValue: string;
  setSearchInputValue: (value: string) => void;

  //

  productCreationDetails: ProductCreationDetails | undefined;
  setProductCreationDetails: (
    details: ProductCreationDetails | undefined,
  ) => void;
  productPreviewDetails: MedicationPackageDetails | undefined;
  setProductPreviewDetails: (
    details: MedicationPackageDetails | undefined,
  ) => void;
  previewModalOpen: boolean;
  setPreviewModalOpen: (bool: boolean) => void;
  loadingPreview: boolean;
  setLoadingPreview: (bool: boolean) => void;
  warningModalOpen: boolean;
  setWarningModalOpen: (bool: boolean) => void;
  previewProduct: (
    data: MedicationPackageDetails | undefined,
    ticket: Ticket,
    branch: string,
    serviceStatus: ServiceStatus | undefined,
  ) => void;
}

const useAuthoringStore = create<AuthoringStoreConfig>()((set, get) => ({
  selectedProduct: null,
  setSelectedProduct: concept => {
    set({ selectedProduct: concept });
  },
  selectedProductType: ProductType.medication,
  setSelectedProductType: productType => {
    set({ selectedProductType: productType });
  },
  isLoadingProduct: false,
  setIsLoadingProduct: bool => {
    set({ isLoadingProduct: bool });
  },
  formContainsData: false,
  setFormContainsData: bool => {
    set({ formContainsData: bool });
  },
  handleSelectedProductChange: (concept, productType) => {
    get().setSelectedProduct(concept);
    get().setSelectedProductType(productType);
  },
  handleClearForm: () => {
    get().setSelectedProduct(null);
    get().setSearchInputValue('');
    get().setFormContainsData(false);
  },
  searchInputValue: '',
  setSearchInputValue: value => {
    set({ searchInputValue: value });
  },

  //

  productCreationDetails: undefined,
  setProductCreationDetails: details => {
    set({ productCreationDetails: details });
  },
  productPreviewDetails: undefined,
  setProductPreviewDetails: details => {
    set({ productPreviewDetails: details });
  },
  previewModalOpen: false,
  setPreviewModalOpen: bool => {
    set({ previewModalOpen: bool });
  },
  loadingPreview: false,
  setLoadingPreview: bool => {
    set({ loadingPreview: bool });
  },
  warningModalOpen: false,
  setWarningModalOpen: bool => {
    set({ warningModalOpen: bool });
  },
  previewProduct: (data, ticket, branch, serviceStatus) => {
    get().setWarningModalOpen(false);
    const request = data ? data : get().productPreviewDetails;

    if (request) {
      get().setProductCreationDetails(undefined);
      get().setPreviewModalOpen(true);
      const validatedData = cleanPackageDetails(request);
      ConceptService.previewNewMedicationProduct(validatedData, branch)
        .then(mp => {
          const productCreationObj: ProductCreationDetails = {
            productSummary: mp,
            packageDetails: validatedData,
            ticketId: ticket.id,
          };
          get().setProductCreationDetails(productCreationObj);
          get().setPreviewModalOpen(true);
          get().setLoadingPreview(false);
        })
        .catch(err => {
          snowstormErrorHandler(
            err,
            `Failed preview for  [${request.productName?.pt?.term}]`,
            serviceStatus,
          );
          get().setLoadingPreview(false);
          get().setPreviewModalOpen(false);
        });
    }
  },
}));

export default useAuthoringStore;
