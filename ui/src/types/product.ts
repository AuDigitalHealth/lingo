import { Concept, ProductModel } from './concept.ts';

export enum ProductType {
  medication = 'MEDICATION',
  device = 'DEVICE',
}

export enum ProductGroupType {
  MP = 'Product',
  MPUU = 'Generic Product',
  MPP = 'Generic Pack',
  CTPP = 'Branded Container',
  TP = 'Brand Name',
  TPUU = 'Branded Product',
  TPP = 'Brand Pack',
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
  activeIngredients: Ingredient[];
  type: string;
  otherIdentifyingInformation: string;
}

export interface MedicationPackageDetails {
  productName?: Concept | null;
  containerType?: Concept | null;
  externalIdentifiers?: ExternalIdentifier[];
  containedProducts: MedicationProductQuantity[];
  containedPackages: MedicationPackageQuantity[];
  selectedConceptIdentifiers?: string[];
}

/*** Device specific **/

export interface DeviceProductDetails {
  productName: Concept;
  deviceType: Concept;
  otherIdentifyingInformation: string;
  specificDeviceType: Concept;
}
export interface DeviceProductQuantity {
  value?: number;
  unit?: Concept;
  productDetails?: DeviceProductDetails;
}
export interface DevicePackageDetails {
  productName?: Concept;
  containerType?: Concept;
  externalIdentifiers?: ExternalIdentifier[];
  containedProducts: DeviceProductQuantity[];
  // containedPackages?: any[];
}

export interface ProductCreationDetails {
  productSummary: ProductModel;
  packageDetails: MedicationPackageDetails | DevicePackageDetails;
  ticketId: number;
}
