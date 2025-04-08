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

import { ConceptSearchResult } from '../../pages/products/components/SearchProduct.tsx';
import {
  Concept,
  ConceptResponse,
  ConceptSearchItem,
  Description,
  Edge,
  Product,
  ProductSummary,
} from '../../types/concept.ts';

import {
  BrandPackSizeCreationDetails,
  DevicePackageDetails,
  DeviceProductQuantity,
  ExternalIdentifier,
  Ingredient,
  MedicationPackageDetails,
  MedicationPackageQuantity,
  MedicationProductQuantity,
  ProductType,
} from '../../types/product.ts';
import { createFilterOptions } from '@mui/material';
import Verhoeff from './Verhoeff.ts';
import {
  extractSemanticTag,
  removeSemanticTagFromTerm,
} from './ProductPreviewUtils.ts';
import { LanguageRefset } from '../../types/Project.ts';

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
  return (
    isNumeric(id) &&
    Number(id) > 0 &&
    id.length >= 6 &&
    id.length <= 18 &&
    // && Enums.Partition.fromCode(Common.getPartition(id)) != null //TODO need to expand this
    Verhoeff.isValid(id)
  );
}

export function isSctIds(ids: string[]) {
  if (ids == null || ids.length === 0) {
    return false;
  }
  return ids.every(id => isSctId(id));
}
export function filterByLabel(productLabels: Product[], label: string) {
  if (!productLabels) {
    return [];
  }
  return productLabels.filter(productLabel => productLabel.label === label);
}

export function getProductDisplayName(productModel: ProductSummary) {
  // TODO: Refactor this properly
  if (!productModel) {
    return '';
  }
  if (
    (productModel.subjects && productModel.subjects.length > 0
      ? productModel.subjects.pop()?.newConcept
      : false) ||
    !productModel.subjects ||
    productModel.subjects.length === 0
  ) {
    const ctppProducts = productModel.nodes.filter(
      product => product.label === 'CTPP' && product.newConcept,
    );
    if (ctppProducts && ctppProducts.length > 0) {
      return ctppProducts[0].newConceptDetails?.preferredTerm;
    }
  }
  return productModel.subjects?.pop()?.preferredTerm;
}
export function isFsnToggleOn(): boolean {
  return localStorage.getItem('fsn_toggle') === 'true' ? true : false;
}

export function concat(...args: (string | number | undefined | null)[]) {
  let output = ``;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === null || args[i] === undefined) {
      continue;
    }
    output = `${output}${args[i]}`;
  }
  return output;
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
      type: ProductType.medication,
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

export const defaultDeviceProduct = (
  defaultUnit: Concept,
  defaultBrandName: Concept | undefined | null,
) => {
  const productQuantity: DeviceProductQuantity = {
    productDetails: {
      otherIdentifyingInformation: 'None',
      type: ProductType.device,
      productName: isValidBrandName(defaultBrandName)
        ? defaultBrandName
        : undefined,
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
export const UnitMgId = '258684004';
export const UnitMLId = '258773002';
export const OWL_EXPRESSION_ID = '733073007';
export const ARTG_ID = '11000168105';

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
  stringify: (option: ConceptSearchResult) =>
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

function cleanDeviceProductQty(item: DeviceProductQuantity) {
  if (item.productDetails) {
    if (isEmptyObjectByValue(item.productDetails?.newSpecificDeviceName)) {
      item.productDetails['newSpecificDeviceName'] = null;
    }
    if (isEmptyObjectByValue(item.productDetails?.specificDeviceType)) {
      item.productDetails['specificDeviceType'] = null;
    }
    if (isEmptyObjectByValue(item.productDetails?.otherParentConcepts)) {
      item.productDetails['otherParentConcepts'] = null;
    }
  }
}
export function cleanPackageDetails(packageDetails: MedicationPackageDetails) {
  packageDetails.containedPackages.forEach(function (packageQty) {
    packageQty.packageDetails?.containedProducts.map(p => cleanProductQty(p));
  });
  packageDetails.containedProducts.map(p => cleanProductQty(p));
  return packageDetails;
}

export function cleanProductSummary(productSummary: ProductSummary) {
  productSummary.nodes.forEach(node => {
    if (node.concept !== null && node.newConceptDetails) {
      node.newConceptDetails = null;
    }
  });

  // re-attach semantic tags if they have not been edited
  reattachSemanticTags(productSummary);

  return productSummary;
}

export function removeSemanticTagsFromTerms(
  productModelResponse: ProductSummary,
) {
  return productModelResponse.nodes.map(node => {
    if (node.newConceptDetails?.fullySpecifiedName) {
      const semanticTag = extractSemanticTag(
        node.newConceptDetails?.fullySpecifiedName,
      );
      if (semanticTag) {
        node.newConceptDetails.semanticTag = semanticTag;
        const termWithoutTag = removeSemanticTagFromTerm(
          node.newConceptDetails.fullySpecifiedName,
        );
        node.newConceptDetails.fullySpecifiedName = termWithoutTag
          ? termWithoutTag
          : '';
      }
    }
    return node;
  });
}

export function reattachSemanticTags(productSummary: ProductSummary) {
  productSummary.nodes.forEach(node => {
    if (node.newConceptDetails) {
      const newSemanticTag = extractSemanticTag(
        node.newConceptDetails.fullySpecifiedName,
      );
      // there's a new semantic tag, so update the semanticTag
      if (node.newConceptDetails.semanticTag && newSemanticTag) {
        node.newConceptDetails.semanticTag = newSemanticTag;
        return;
      }
      // re-add old one
      if (node.newConceptDetails && node.newConceptDetails.semanticTag) {
        node.newConceptDetails.fullySpecifiedName = `${node.newConceptDetails.fullySpecifiedName?.trim()} ${node.newConceptDetails.semanticTag}`;
      }
    }
  });
}

export function getSemanticTagChanges(
  productSummary: ProductSummary | undefined,
) {
  if (!productSummary) return { hasChanged: false, changeMessages: [''] };
  let hasChanged = false;
  const changeMessages = [''];
  productSummary.nodes.forEach(node => {
    if (node.newConceptDetails) {
      const newSemanticTag = extractSemanticTag(
        node.newConceptDetails.fullySpecifiedName,
      );
      // there's a new semantic tag, so set hasChanged = true
      if (
        node.newConceptDetails.semanticTag &&
        newSemanticTag &&
        newSemanticTag !== node.newConceptDetails.semanticTag
      ) {
        hasChanged = true;
        changeMessages.push(
          `Semantic tag changed from: ${node.newConceptDetails.semanticTag} to: ${newSemanticTag}. \n\n`,
        );
      }
    }
  });
  return { hasChanged: hasChanged, changeMessages: changeMessages };
}

export function cleanBrandPackSizeDetails(
  brandPackSizeDetails: BrandPackSizeCreationDetails,
) {
  if (
    brandPackSizeDetails.brands !== null &&
    brandPackSizeDetails.brands !== undefined &&
    brandPackSizeDetails.brands.brands !== null &&
    brandPackSizeDetails.brands.brands !== undefined &&
    brandPackSizeDetails.brands.brands.length === 0
  ) {
    brandPackSizeDetails.brands = undefined;
  }
  if (
    brandPackSizeDetails.packSizes !== null &&
    brandPackSizeDetails.packSizes !== undefined &&
    brandPackSizeDetails.packSizes.packSizes !== null &&
    brandPackSizeDetails.packSizes.packSizes !== undefined &&
    brandPackSizeDetails.packSizes.packSizes.length === 0
  ) {
    brandPackSizeDetails.packSizes = undefined;
  }
  if (!brandPackSizeDetails.type) {
    brandPackSizeDetails.type = 'brand-pack-size';
  }
  return brandPackSizeDetails;
}

export function cleanDevicePackageDetails(
  packageDetails: DevicePackageDetails,
) {
  packageDetails.containedProducts.map(p => cleanDeviceProductQty(p));
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
export const emptySnowstormResponse: ConceptResponse = {
  items: [],
  limit: 0,
  searchAfter: '',
  offset: 0,
  searchAfterArray: [],
  total: 0,
};
export const mapDefaultOptionsToConceptSearchResult = (
  optionValues: Concept[],
) => {
  return optionValues.map(option => {
    return { data: option, type: 'DefaultOption' };
  });
};
export function parseSearchTermsSctId(
  searchTerm: string | null | undefined,
): string[] {
  if (!searchTerm) return [];
  // Split the searchTerm by commas and trim each part
  let terms = searchTerm.split(',').map(term => term.trim());

  terms = terms.filter(term => {
    return isSctId(term);
  });
  // If the last term is an empty string or not a valid number, remove it
  if (
    terms[terms.length - 1] === '' ||
    isNaN(Number(terms[terms.length - 1]))
  ) {
    terms.pop();
  }

  // If any part is not a valid number, return an empty array
  if (terms.some(term => isNaN(Number(term)))) {
    return [];
  }

  // Convert each valid part to a number and return as an array
  return terms;
}
export const generateArtgObj = (artgValue: string): ExternalIdentifier => {
  return {
    identifierScheme: 'https://www.tga.gov.au/artg',
    identifierValue: artgValue,
  };
};

export const isPreferredTerm = (
  description: Description,
  defaultLangRefset: LanguageRefset | undefined,
) => {
  if (!description) {
    return false;
  }
  return (
    description.type === 'SYNONYM' &&
    defaultLangRefset !== undefined &&
    description.acceptabilityMap?.[defaultLangRefset.en] === 'PREFERRED'
  );
};

export const sortDescriptions = (
  descs: Description[] | undefined,
  defaultLangRefset: LanguageRefset | undefined,
): Description[] => {
  if (!descs) return [];
  const fsn = descs.filter(d => {
    return d.type === 'FSN';
  });

  const preferredSynonym = descs.find(desc => {
    return isPreferredTerm(desc, defaultLangRefset);
  });
  const otherSynonyms = descs.filter(
    d => d.type === 'SYNONYM' && d !== preferredSynonym,
  );

  const tempDescriptions = [
    ...fsn,
    ...(preferredSynonym ? [preferredSynonym] : []),
    ...otherSynonyms,
  ];
  return tempDescriptions;
};

export const findDefaultLangRefset = (langRefsets: LanguageRefset[]) => {
  return langRefsets.find(langRefsets => {
    return langRefsets.default === 'true';
  });
};
