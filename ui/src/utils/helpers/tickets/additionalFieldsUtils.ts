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

import { AdditionalFieldType } from '../../../types/tickets/ticket';
import { NonDefiningProperty } from '../../../types/product.ts';

export const sortAdditionalFields = (
  unsortedFields: AdditionalFieldType[] | null,
): AdditionalFieldType[] | undefined => {
  if (unsortedFields === null) {
    return [];
  }
  let sortedFields = [] as AdditionalFieldType[];

  const schedule = unsortedFields.find(field => {
    return field.name === 'Schedule';
  });

  const artgid = unsortedFields.find(field => {
    return field.name === 'ARTGID';
  });

  const startDate = unsortedFields.find(field => {
    return field.name === 'StartDate';
  });

  const effectiveDate = unsortedFields.find(field => {
    return field.name === 'EffectiveDate';
  });

  const remainingFields = unsortedFields.filter(field => {
    return !(
      field.name === 'Schedule' ||
      field.name === 'ARTGID' ||
      field.name === 'StartDate' ||
      field.name === 'EffectiveDate'
    );
  });

  if (schedule) {
    sortedFields.push(schedule);
  }
  if (artgid) {
    sortedFields.push(artgid);
  }
  if (startDate) {
    sortedFields.push(startDate);
  }
  if (effectiveDate) {
    sortedFields.push(effectiveDate);
  }
  if (remainingFields) {
    sortedFields = sortedFields.concat(remainingFields);
  }

  return sortedFields;
};

export const sortNonDefiningProperties = (
  properties: NonDefiningProperty[],
): NonDefiningProperty[] => {
  if (!properties || properties.length === 0) {
    return [];
  }

  return properties.slice().sort((a, b) => {
    // First sort by identifierScheme
    const schemeA = a.identifierScheme || '';
    const schemeB = b.identifierScheme || '';

    const schemeComparison = schemeA.localeCompare(schemeB);
    if (schemeComparison !== 0) {
      return schemeComparison;
    }

    // Then sort by value if identifierScheme is the same
    // For numeric values, try to sort numerically
    const aValue =
      a.value !== null
        ? a.value
        : a.valueObject?.pt?.term || a.valueObject?.conceptId || '';
    const bValue =
      b.value !== null
        ? b.value
        : b.valueObject?.pt?.term || b.valueObject?.conceptId || '';

    // Try numeric sorting if both values can be parsed as numbers
    const numA = parseFloat(String(aValue));
    const numB = parseFloat(String(bValue));

    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }

    // Fall back to string comparison for non-numeric values
    return String(aValue).localeCompare(String(bValue));
  });
};

export function areTwoNonDefiningPropertiesArraysEqual(
  array1: NonDefiningProperty[] | undefined,
  array2: NonDefiningProperty[] | undefined,
): boolean {
  if (array1 === undefined && array2 === undefined) return true;
  if (array1 === undefined || array2 === undefined) return true;

  if (array1.length !== array2.length) {
    return false; // Arrays must have the same length
  }

  const sortedArray1 = sortNonDefiningProperties(array1);
  const sortedArray2 = sortNonDefiningProperties(array2);
  return sortedArray1.every(
    (item, index) =>
      item.identifierScheme === sortedArray2[index].identifierScheme &&
      item.value === sortedArray2[index].value &&
      item.valueObject === sortedArray2[index].valueObject,
  );
}
