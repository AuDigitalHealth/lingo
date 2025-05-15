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

import _ from 'lodash';

export const getItemTitle = (
  uiSchema: any,
  formData: any,
  index: number,
  defaultTitle = 'Untitled',
) => {
  const titleSource = uiSchema.items?.['ui:options']?.titleSource;
  if (uiSchema.items?.['ui:options']?.defaultTitle) {
    defaultTitle = uiSchema.items?.['ui:options']?.defaultTitle;
  }
  return titleSource && formData && formData[index]
    ? _.get(formData[index], titleSource) || `${defaultTitle} ${index + 1}`
    : `${defaultTitle} ${index + 1}`;
};
export function getFieldName(idSchema) {
  const withoutRoot = idSchema.$id.startsWith('root_')
    ? idSchema.$id.replace('root_', '')
    : idSchema.$id;
  return withoutRoot.replace(/_/g, '.');
}
export function getParentPath(fullPath) {
  fullPath = fullPath.replace(/_/g, '.');
  const match = fullPath.match(/^(.*)\.[^.]+$/);
  return match ? match[1] : fullPath;
}
// Function to get uiSchema path
export function getUiSchemaPath(fieldPath) {
  const parts = fieldPath.split('.');
  const uiSchemaParts = parts.map(part => {
    // Check if the part ends with [index], e.g., "containedProducts[0]"
    const match = part.match(/^(.*)\[\d+\]$/);
    if (match) {
      // Return the base name followed by "items"
      return `${match[1]}.items`;
    }
    return part; // No array index, return unchanged
  });
  return uiSchemaParts.join('.').replaceAll('0', 'items');
}
