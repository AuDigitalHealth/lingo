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

import { Concept, ProductSummary } from './concept.ts';

export enum ProductType {
  medication = 'medication',
  device = 'device',
  brandPackSize = 'brand-pack-size',
  bulkPackSize = 'bulk-pack-size',
  bulkBrand = 'bulk-brand',
}

export enum ActionType {
  newProduct = 'newProduct', //All product types including medication and device
  newDevice = 'newDevice',
  newMedication = 'newMedication',
  newPackSize = 'newPackSize',
  newBrand = 'newBrand',
}

export enum ProductGroupType {
  MP = 'Product',
  MPUU = 'Generic Product',
  MPP = 'Generic Pack',
  CTPP = 'Branded Container',
  TP = 'Brand Name',
  TPUU = 'Branded Product',
  TPP = 'Branded Pack',
}
export interface ExternalIdentifier {
  identifierScheme: string;
  identifierValue: string;
}
export interface Quantity {
  value: number;
  unit?: Concept;
}
export interface MedicationProductQuantity {
  value?: number;
  unit?: Concept;
  productDetails?: MedicationProductDetails;
}
export interface MedicationPackageQuantity {
  value?: number;
  unit?: Concept;
  packageDetails?: MedicationPackageDetails;
}

export interface Ingredient {
  activeIngredient?: Concept | null;
  preciseIngredient?: Concept | null;
  basisOfStrengthSubstance?: Concept | null;
  totalQuantity?: Quantity | null;
  concentrationStrength?: Quantity | null;
}
export interface MedicationProductDetails {
  productName?: Concept | null;
  genericForm?: Concept | null;
  specificForm?: Concept | null;
  quantity?: Quantity | null;
  containerType?: Concept | null;
  deviceType?: Concept | null;
  activeIngredients?: Ingredient[];
  type?: ProductType;
  otherIdentifyingInformation?: string;
}

export interface MedicationPackageDetails {
  productName?: Concept | null;
  containerType?: Concept | null;
  externalIdentifiers?: ExternalIdentifier[];
  containedProducts: MedicationProductQuantity[];
  containedPackages: MedicationPackageQuantity[];
  selectedConceptIdentifiers?: string[];
}

export interface NewPackSizeDetails {
  selectedConceptIdentifiers?: string[];
}

export interface NewBrandDetails {
  selectedConceptIdentifiers?: string[];
}

/*** Device specific **/

export interface DeviceProductDetails {
  productName?: Concept | null;
  deviceType?: Concept;
  otherIdentifyingInformation?: string;
  specificDeviceType?: Concept | null;
  newSpecificDeviceName?: string | null;
  otherParentConcepts?: Concept[] | null;
  type?: ProductType;
}
export interface DeviceProductQuantity {
  value?: number;
  unit?: Concept;
  productDetails?: DeviceProductDetails;
}
export interface DevicePackageDetails {
  productName?: Concept | null;
  containerType?: Concept;
  externalIdentifiers?: ExternalIdentifier[];
  containedProducts: DeviceProductQuantity[];
  selectedConceptIdentifiers?: string[];
}

export interface BrandPackSizeCreationDetails {
  type?: string;
  productId: string;
  brands?: ProductBrands;
  packSizes?: ProductPackSizes;
}

export interface ProductCreationDetails {
  productSummary: ProductSummary;
  packageDetails:
    | MedicationPackageDetails
    | DevicePackageDetails
    | BrandPackSizeCreationDetails;
  ticketId: number;
  partialSaveName: string | null;
}

export interface BulkProductCreationDetails {
  productSummary: ProductSummary;
  details: BrandPackSizeCreationDetails;
  ticketId: number;
}

export interface ProductBrands {
  productId?: string;
  brands?: BrandWithIdentifiers[];
}

export interface ProductPackSizes {
  productId?: string;
  unitOfMeasure?: SnowstormConceptMini;
  packSizes?: PackSizeWithIdentifiers[];
}

export interface BrandWithIdentifiers {
  brand: SnowstormConceptMini;
  externalIdentifiers: ExternalIdentifier[];
}

export interface PackSizeWithIdentifiers {
  packSize: BigDecimal;
  externalIdentifiers: ExternalIdentifier[];
}

export type SnowstormConceptMini = Concept;
// {
//   conceptId?: string;
//   active?: boolean;
//   definitionStatus?: string;
//   moduleId?: string;
//   effectiveTime?: string;
//   fsn?: SnowstormTermLangPojo;
//   pt?: SnowstormTermLangPojo;
//   descendantCount?: number;
//   isLeafInferred?: boolean;
//   isLeafStated?: boolean;
//   id?: string;
//   definitionStatusId?: string;
//   leafInferred?: SnowstormConceptMini;
//   leafStated?: SnowstormConceptMini;
//   extraFields?: { [key: string]: any };
//   idAndFsnTerm?: string;
// }

export interface SnowstormTermLangPojo {
  term?: string;
  lang?: string;
}
export interface BrandCreationDetails {
  brandName: string;
  ticketId: number;
}
export type BigDecimal = number;
