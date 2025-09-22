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

import { get } from 'lodash';

export interface Condition {
  field: string; // The field to check in formData
  operator:
    | 'lengthGreaterThan'
    | 'equals'
    | 'notEquals'
    | 'exists'
    | 'notExists';
  value?: any;
}

// Evaluate a single condition
const evaluateCondition = (formData: any, condition: Condition): boolean => {
  const { field, operator, value } = condition;
  const dependentFieldValue = get(formData, field);

  switch (operator) {
    case 'lengthGreaterThan':
      return (
        Array.isArray(dependentFieldValue) &&
        dependentFieldValue.length > (value ?? 0)
      );
    case 'equals':
      return dependentFieldValue === value;
    case 'notEquals':
      return dependentFieldValue !== value;
    case 'exists':
      return dependentFieldValue !== undefined && dependentFieldValue !== null;
    case 'notExists':
      return dependentFieldValue === undefined || dependentFieldValue === null;
    default:
      console.warn(`Unsupported operator: ${operator}`);
      return false;
  }
};

// Main function to check conditions
export const shouldHideField = (
  formData: any,
  conditions: Condition[] = [],
  conditionLogic: 'and' | 'or' = 'and',
): boolean => {
  let hideField: boolean;
  if (conditions.length === 0) {
    hideField = false; // No conditions means show the field
  } else if (conditionLogic === 'and') {
    hideField = conditions.every(condition =>
      evaluateCondition(formData, condition),
    );
  } else {
    // 'or' logic
    hideField = conditions.some(condition =>
      evaluateCondition(formData, condition),
    );
  }
  return hideField;
};
