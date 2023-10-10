import { Concept } from './concept.ts';

// export interface SnowstormConceptMiniComponent {
//   conceptId: string;
//   active: boolean;
//   definitionStatus: DefinitionStatus;
//   moduleId: string;
//   effectiveTime: string | null;
//   fsn: Term;
//   pt: Term;
//   descendantCount: string | null;
//   isLeafInferred: boolean | null;
//   isLeafStated: any;
//   id: string;
//   definitionStatusId: any;
//   leafInferred: any;
//   leafStated: any;
//   extraFields: any;
//   idAndFsnTerm: string | null;
// }
export interface ExternalIdentifier {
  identifierScheme: string;
  identifierValue: string;
}
export interface Quantity {
  value: number;
  unit: Concept;
}
export interface MedicationProductQuantity {
  value: number;
  unit: Concept;
  productDetails: MedicationProductDetails;
}
export interface MedicationPackageQuantity {
  value: number;
  unit: MedicationPackageDetails;
  packageDetails: MedicationPackageDetails;
}
export interface ProductDetails {
  productName: Concept;
  deviceType: Concept;
  otherIdentifyingInformation: string;
}
export interface Ingredient {
  activeIngredient: Concept;
  preciseIngredient: Concept;
  basisOfStrengthSubstance: Concept;
  totalQuantity: Quantity;
  concentrationStrength: Quantity;
}
export interface MedicationProductDetails {
  productName: Concept;
  genericForm: Concept;
  specificForm: Concept;
  quantity: Quantity;
  containerType: Concept;
  activeIngredients: Ingredient[];
}

export interface MedicationPackageDetails {
  productName: Concept;
  containerType: Concept;
  externalIdentifiers: ExternalIdentifier[];
  containedProducts: MedicationProductQuantity[];
  containedPackages: MedicationPackageQuantity[];
}
