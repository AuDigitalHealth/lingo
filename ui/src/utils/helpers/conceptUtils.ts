import {
  Concept,
  ConceptSearchItem,
  Edge,
  Product,
} from '../../types/concept.ts';

import {
  Ingredient,
  MedicationPackageDetails,
  MedicationPackageQuantity,
  MedicationProductQuantity,
  ProductType,
} from '../../types/product.ts';
import { createFilterOptions } from '@mui/material';

function isNumeric(value: string) {
  return /^\d+$/.test(value);
}

export function mapToConceptIds(searchItem: ConceptSearchItem[]): string[] {
  const conceptList = searchItem.map(function (item) {
    const referencedComponentId = item.referencedComponent.conceptId as string;
    return referencedComponentId;
  });
  return conceptList;
}

export function isArtgId(id: string) {
  if (id == null) {
    return false;
  }
  id = '' + id;
  return (
    isNumeric(id) &&
    Number(id) > 0 &&
    id.length >= 4 &&
    id.length <= 15 &&
    id.match(/\./) == null
  );
}

export function isSctId(id: string) {
  if (id == null) {
    return false;
  }
  id = '' + id;
  return isNumeric(id) && Number(id) > 0 && id.length >= 6 && id.length <= 18;
  // && Enums.Partition.fromCode(Common.getPartition(id)) != null //TODO need to expand this
  // && Verhoeff.isValid(id);
}

export function isSctIds(ids: string[]) {
  if (ids == null || ids.length === 0) {
    return false;
  }

  ids.forEach(id => {
    const thisIdIsValid = isSctId(id);
    if (!thisIdIsValid) return false;
  });

  return true;
}
export function filterByLabel(productLabels: Product[], label: string) {
  if (!productLabels) {
    return [];
  }
  return productLabels.filter(productLabel => productLabel.label === label);
}
export function isFsnToggleOn(): boolean {
  return localStorage.getItem('fsn_toggle') === 'true' ? true : false;
}

export function findRelations(
  edges: Edge[],
  nodeA: string,
  nodeB: string,
): Edge[] {
  const related = edges.filter(function (el) {
    return (
      (el.source === nodeA && el.target === nodeB) ||
      (el.source === nodeB && el.target === nodeA)
    );
  });
  return related;
}

export function findProductUsingId(conceptId: string, nodes: Product[]) {
  const product = nodes.find(function (p) {
    return p.conceptId === conceptId;
  });
  return product;
}
export function findConceptUsingPT(pt: string, concepts: Concept[]) {
  if (!pt || pt === '' || concepts.length === 0) {
    return null;
  }
  const concept = concepts.find(function (c) {
    return c.pt?.term.toUpperCase() === pt.toUpperCase();
  });
  return concept ? concept : null;
}

export function containsNewConcept(nodes: Product[]) {
  const product = nodes.find(function (p) {
    return p.newConcept;
  });
  return product !== undefined;
}
export const isValidConceptName = (concept: Concept) => {
  return concept && concept.pt?.term !== '' && concept.pt?.term !== null;
};

export const isValidConcept = (concept: Concept | null | undefined) => {
  return concept && concept.id;
};

export const isUnitEach = (concept: Concept | null | undefined) => {
  return concept && concept.id === UnitEachId;
};

export const defaultIngredient = () => {
  const ingredient: Ingredient = {
    activeIngredient: null,
    preciseIngredient: null,
    basisOfStrengthSubstance: null,
    concentrationStrength: null,
    totalQuantity: null,
  };
  return ingredient;
};

const isValidBrandName = (defaultBrandName: Concept | undefined | null) => {
  console.log(defaultBrandName);
  return (
    defaultBrandName &&
    defaultBrandName.conceptId &&
    defaultBrandName.conceptId.trim().length > 1
  );
};
export const defaultProduct = (
  defaultUnit: Concept,
  defaultBrandName: Concept | undefined | null,
) => {
  const productQuantity: MedicationProductQuantity = {
    productDetails: {
      activeIngredients: [defaultIngredient()],
      type: 'medication',
      otherIdentifyingInformation: 'None',
      productName: isValidBrandName(defaultBrandName)
        ? defaultBrandName
        : undefined,
      genericForm: null,
      containerType: null,
      deviceType: null,
      specificForm: null,
    },
    value: 1,
    unit: defaultUnit,
  };
  return productQuantity;
};
export const defaultPackage = (
  defaultUnit: Concept,
  defaultBrandName: Concept | undefined | null,
) => {
  const medicationPackageQty: MedicationPackageQuantity = {
    unit: defaultUnit,
    value: 1,
    packageDetails: {
      productName: isValidBrandName(defaultBrandName)
        ? defaultBrandName
        : undefined,
      containerType: undefined,

      externalIdentifiers: [],
      containedPackages: [],
      containedProducts: [defaultProduct(defaultUnit, defaultBrandName)],
    },
  };
  return medicationPackageQty;
};

export const isDeviceType = (productType: ProductType) => {
  return productType === ProductType.device;
};
export const UnitEachId = '732935002';
export const UnitPackId = '706437002';

export const filterKeypress = (e: React.KeyboardEvent<HTMLDivElement>) => {
  if (e.key === 'Enter') {
    e.preventDefault();
  }
};
// eslint-disable-next-line
export function isEmptyObjectByValue(obj: any): boolean {
  if (obj === null || obj === undefined) {
    return true;
  }
  return Object.values(obj as object).every(value => {
    if (
      value === null ||
      value === undefined ||
      value === false ||
      value === ''
    ) {
      return true;
    }
    return false;
  });
}
export const filterOptionsForConceptAutocomplete = createFilterOptions({
  matchFrom: 'any',
  stringify: (option: Concept) =>
    (option.pt?.term as string) + (option.fsn?.term as string),
});
export function filterByActiveConcepts(concepts: Concept[]) {
  const activeConcepts = concepts.filter(function (concept) {
    return concept.active;
  });
  return activeConcepts;
}

function cleanIngredient(item: Ingredient) {
  if (isEmptyObjectByValue(item.concentrationStrength)) {
    item['concentrationStrength'] = null;
  }
  if (isEmptyObjectByValue(item.totalQuantity)) {
    item['totalQuantity'] = null;
  }
  if (isEmptyObjectByValue(item.basisOfStrengthSubstance)) {
    item['basisOfStrengthSubstance'] = null;
  }
}
function cleanProductQty(item: MedicationProductQuantity) {
  if (
    item.productDetails &&
    isEmptyObjectByValue(item.productDetails?.quantity)
  ) {
    item.productDetails['quantity'] = null;
  }
  item.productDetails?.activeIngredients?.map(i => cleanIngredient(i));
}
export function cleanPackageDetails(packageDetails: MedicationPackageDetails) {
  packageDetails.containedPackages.forEach(function (packageQty) {
    packageQty.packageDetails?.containedProducts.map(p => cleanProductQty(p));
  });
  packageDetails.containedProducts.map(p => cleanProductQty(p));
  return packageDetails;
}
export const setEmptyToNull = (v: string | null | undefined) => {
  if (v === '') {
    return null;
  } else if (v && v.trim() === '') {
    return null;
  }
  return v;
};
