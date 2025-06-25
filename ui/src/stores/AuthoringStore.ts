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
import { Concept } from '../types/concept.ts';
import {
  ActionType,
  BrandPackSizeCreationDetails,
  DevicePackageDetails,
  MedicationPackageDetails,
  ProductSaveDetails,
  ProductType,
} from '../types/product.ts';
import { snowstormErrorHandler } from '../types/ErrorHandler.ts';
import {
  cleanBrandPackSizeDetails,
  cleanDevicePackageDetails,
  cleanPackageDetails,
} from '../utils/helpers/conceptUtils.ts';
import { Ticket } from '../types/tickets/ticket.ts';
import { ServiceStatus } from '../types/applicationConfig.ts';
import type { ValueSetExpansionContains } from 'fhir/r4';
import productService from '../api/ProductService.ts';

interface AuthoringStoreConfig {
  selectedProduct: Concept | ValueSetExpansionContains | null;
  setSelectedProduct: (
    concept: Concept | ValueSetExpansionContains | undefined,
  ) => void;
  selectedProductType: ProductType;
  setSelectedProductType: (productType: ProductType) => void;
  selectedActionType: ActionType;
  setSelectedActionType: (actionType: ActionType) => void;
  isLoadingProduct: boolean;
  setIsLoadingProduct: (bool: boolean) => void;
  formContainsData: boolean;
  setFormContainsData: (bool: boolean) => void;
  handleSelectedProductChange: (
    concept: Concept | ValueSetExpansionContains | undefined,
    productType: ProductType,
    actionType: ActionType,
  ) => void;
  handleClearForm: () => void;
  searchInputValue: string;
  setSearchInputValue: (value: string) => void;
  forceNavigation: boolean;
  setForceNavigation: (bool: boolean) => void;
  previewErrorKeys: string[];
  setPreviewErrorKeys: (errorKeys: string[]) => void;
  //

  productCreationDetails: ProductSaveDetails | undefined;
  setProductCreationDetails: (
    details: ProductSaveDetails | undefined,
  ) => void;
  productPreviewDetails: MedicationPackageDetails | undefined;
  setProductPreviewDetails: (
    details: MedicationPackageDetails | undefined,
  ) => void;

  brandPackSizeCreationDetails: BrandPackSizeCreationDetails | undefined;
  setBrandPackSizeCreationDetails: (
    details: BrandPackSizeCreationDetails | undefined,
  ) => void;
  brandPackSizePreviewDetails: BrandPackSizeCreationDetails | undefined;
  setBrandPackSizePreviewDetails: (
    details: BrandPackSizeCreationDetails | undefined,
  ) => void;

  devicePreviewDetails: DevicePackageDetails | undefined;
  setDevicePreviewDetails: (details: DevicePackageDetails | undefined) => void;
  previewModalOpen: boolean;
  setPreviewModalOpen: (bool: boolean) => void;
  loadingPreview: boolean;
  setLoadingPreview: (bool: boolean) => void;
  warningModalOpen: boolean;
  setWarningModalOpen: (bool: boolean) => void;
  previewMedicationProduct: (
    data: MedicationPackageDetails | undefined,
    ticket: Ticket,
    branch: string,
    serviceStatus: ServiceStatus | undefined,
    partialSaveName?: string,
  ) => void;
  previewBrandPackSize: (
    data: BrandPackSizeCreationDetails | undefined,
    ticket: Ticket,
    branch: string,
    serviceStatus: ServiceStatus | undefined,
    partialSaveName?: string,
  ) => void;
  previewDeviceProduct: (
    data: DevicePackageDetails | undefined,
    ticket: Ticket,
    branch: string,
    serviceStatus: ServiceStatus | undefined,
    partialSaveName?: string,
  ) => void;
  handlePreviewToggleModal: (
    event: object,
    reason: 'backdropClick' | 'escapeKeyDown',
  ) => void;
}

const useAuthoringStore = create<AuthoringStoreConfig>()((set, get) => ({
  selectedProduct: null,
  forceNavigation: false,
  previewErrorKeys: [],
  setForceNavigation: (bool: boolean) => {
    set({ forceNavigation: bool });
  },
  setSelectedProduct: concept => {
    set({ selectedProduct: concept || null });
  },
  selectedProductType: ProductType.medication,
  setSelectedProductType: productType => {
    set({ selectedProductType: productType });
  },
  selectedActionType: ActionType.newMedication,
  setSelectedActionType: actionType => {
    set({ selectedActionType: actionType });
  },
  isLoadingProduct: false,
  setIsLoadingProduct: bool => {
    set({ isLoadingProduct: bool });
  },
  formContainsData: false,
  setFormContainsData: bool => {
    set({ formContainsData: bool });
  },
  setPreviewErrorKeys: errorKeys => {
    set({ previewErrorKeys: errorKeys });
  },
  handleSelectedProductChange: (concept, productType, actionType) => {
    get().setSelectedProduct(concept);
    get().setSelectedProductType(productType);
    get().setSelectedActionType(actionType);
  },
  handleClearForm: () => {
    get().setSelectedProduct(undefined);
    get().setSearchInputValue('');
    get().setFormContainsData(false);
    get().setForceNavigation(false);
  },
  searchInputValue: '',
  setSearchInputValue: value => {
    set({ searchInputValue: value });
  },

  productCreationDetails: undefined,
  setProductCreationDetails: details => {
    set({ productCreationDetails: details });
  },
  productPreviewDetails: undefined,
  setProductPreviewDetails: details => {
    set({ productPreviewDetails: details });
  },
  brandPackSizeCreationDetails: undefined,
  setBrandPackSizeCreationDetails: details => {
    set({ brandPackSizeCreationDetails: details });
  },
  brandPackSizePreviewDetails: undefined,
  setBrandPackSizePreviewDetails: details => {
    set({ brandPackSizePreviewDetails: details });
  },
  devicePreviewDetails: undefined,
  setDevicePreviewDetails: details => {
    set({ devicePreviewDetails: details });
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
  previewBrandPackSize: (
    data,
    ticket,
    branch,
    serviceStatus,
    partialSaveName,
  ) => {
    get().setWarningModalOpen(false);
    const request = data ? data : get().brandPackSizePreviewDetails;

    if (request) {
      get().setProductCreationDetails(undefined);
      get().setPreviewModalOpen(true);
      const validatedData = cleanBrandPackSizeDetails(request);
      productService
        .previewNewMedicationBrandPackSizes(request, branch)
        .then(mp => {
          const productCreationObj: ProductSaveDetails = {
            productSummary: mp,
            packageDetails: validatedData,
            ticketId: ticket.id,
            partialSaveName: partialSaveName ? partialSaveName : null,
          };
          get().setProductCreationDetails(productCreationObj);
          get().setPreviewModalOpen(true);
          get().setLoadingPreview(false);
        })
        .catch(err => {
          const snackBarKey = snowstormErrorHandler(
            err,
            `Failed preview for  [${request.productId}]`,
            serviceStatus,
          );
          const errorKeys = get().previewErrorKeys;
          errorKeys.push(snackBarKey as string);
          get().setPreviewErrorKeys(errorKeys);

          get().setLoadingPreview(false);
          get().setPreviewModalOpen(false);
        });
    }
  },
  previewMedicationProduct: (
    data,
    ticket,
    branch,
    serviceStatus,
    partialSaveName,
  ) => {
    get().setWarningModalOpen(false);
    const request = data ? data : get().productPreviewDetails;

    if (request) {
      get().setProductCreationDetails(undefined);
      get().setPreviewModalOpen(true);
      const validatedData = cleanPackageDetails(request);
      productService
        .previewCreateMedicationProduct(validatedData, branch)
        .then(mp => {
          const productCreationObj: ProductSaveDetails = {
            productSummary: mp,
            packageDetails: validatedData,
            ticketId: ticket.id,
            partialSaveName: partialSaveName ? partialSaveName : null,
          };
          get().setProductCreationDetails(productCreationObj);
          get().setPreviewModalOpen(true);
          get().setLoadingPreview(false);
        })
        .catch(err => {
          const snackBarKey = snowstormErrorHandler(
            err,
            `Failed preview for  [${request.productName?.pt?.term}]`,
            serviceStatus,
          );
          const errorKeys = get().previewErrorKeys;
          errorKeys.push(snackBarKey as string);
          get().setPreviewErrorKeys(errorKeys);

          get().setLoadingPreview(false);
          get().setPreviewModalOpen(false);
        });
    }
  },
  previewDeviceProduct: (
    data,
    ticket,
    branch,
    serviceStatus,
    partialSaveName,
  ) => {
    get().setWarningModalOpen(false);
    const request = data ? data : get().devicePreviewDetails;

    if (request) {
      get().setProductCreationDetails(undefined);
      get().setPreviewModalOpen(true);
      const validatedData = cleanDevicePackageDetails(request);
      productService
        .previewNewDeviceProduct(validatedData, branch)
        .then(mp => {
          const productCreationObj: ProductSaveDetails = {
            productSummary: mp,
            packageDetails: validatedData,
            ticketId: ticket.id,
            partialSaveName: partialSaveName ? partialSaveName : null,
          };
          get().setProductCreationDetails(productCreationObj);
          get().setPreviewModalOpen(true);
          get().setLoadingPreview(false);
        })
        .catch(err => {
          const snackBarKey = snowstormErrorHandler(
            err,
            `Failed preview for  [${request.productName?.pt?.term}]`,
            serviceStatus,
          );
          const errorKeys = get().previewErrorKeys;
          errorKeys.push(snackBarKey as string);
          get().setPreviewErrorKeys(errorKeys);

          get().setLoadingPreview(false);
          get().setPreviewModalOpen(false);
        });
    }
  },
  handlePreviewToggleModal: (
    event: object,
    reason: 'backdropClick' | 'escapeKeyDown',
  ) => {
    if (reason && reason === 'backdropClick') return;
    get().setPreviewModalOpen(!get().previewModalOpen);
  },
}));

export default useAuthoringStore;
