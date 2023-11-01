import { Concept } from './concept.ts';

export enum ProductType {
  medication = 'MEDICATION',
  device = 'DEVICE',
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
  packageDetails: MedicationPackageDetailsOpt;
}

export interface Ingredient {
  activeIngredient?: Concept;
  preciseIngredient?: Concept;
  basisOfStrengthSubstance?: Concept;
  totalQuantity?: Quantity;
  concentrationStrength?: Quantity;
}
export interface MedicationProductDetails {
  productName?: Concept;
  genericForm?: Concept;
  specificForm?: Concept;
  quantity?: Quantity;
  containerType?: Concept;
  activeIngredients: Ingredient[];
}

export interface MedicationPackageDetails {
  productName?: Concept;
  containerType?: Concept;
  externalIdentifiers?: ExternalIdentifier[];
  containedProducts: MedicationProductQuantity[];
  containedPackages: MedicationPackageQuantity[];
}

export interface MedicationPackageDetailsOpt {
  productName?: Concept;
  containerType?: Concept;
  externalIdentifiers?: ExternalIdentifier[];
  containedProducts: MedicationProductQuantity[];
  containedPackages: MedicationPackageQuantity[];
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
