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

import _, { get } from 'lodash';
import { resolveRef } from './validationHelper.ts';

/**
 * Utility class for converting between RJSF IDs and Lodash paths
 * and for interacting with formData and uiSchema objects using these paths.
 */
export class RjsfUtils {
  /**
   * Converts an RJSF ID string (dot notation with underscores for arrays)
   * into a Lodash-compatible path string for formData access.
   *
   * Examples:
   * 'root_firstName' -> 'firstName'
   * 'root_address_street' -> 'address.street'
   * 'root_items_0_name' -> 'items[0].name'
   * 'root_items_0' -> 'items[0]'
   * 'root_items_0_details_ingredients_1' -> 'items[0].details.ingredients[1]'
   */
  public static rjsfIdToFormDataPath(rjsfId: string): string {
    const path = rjsfId.replace(/^root_/, '');
    return path
      .replace(/_(\d+)/g, '[$1]')
      .replace(/\.\B/g, '')
      .replace(/_/g, '.');
  }

  /**
   * Converts an RJSF ID string into a Lodash path string for uiSchema access.
   * NOTE: This is the legacy method that does NOT preserve array indexes
   * as separate keys in uiSchema (it uses `.items`).
   *
   * Example: 'root_items_0_name' => 'items.items.name' (incorrect for per-item uiSchema)
   */
  public static rjsfIdToUiSchemaPath(rjsfId: string): string {
    const path = rjsfId.replace(/^root_/, '');
    return path
      .replace(/_(\d+)_/g, '.items.')
      .replace(/\.\B/g, '')
      .replace(/_/g, '.');
  }

  /**
   * Converts an RJSF ID string into a Lodash path string for uiSchema access
   * with PER-ITEM array indexing, using `.items._perItem[index]`.
   *
   * Example:
   * 'root_containedProducts_0_productDetails_activeIngredients_0_refinedActiveIngredient'
   * =>
   * 'containedProducts.items._perItem[0].productDetails.activeIngredients.items._perItem[0].refinedActiveIngredient'
   */
  public static rjsfIdToUiSchemaPerItemPath(rjsfId: string): string {
    const noRoot = rjsfId.replace(/^root_/, '');
    const parts = noRoot.split('_');

    const resultParts: (string | number)[] = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (/^\d+$/.test(part)) {
        // Numeric part = array index
        resultParts.push('items');
        resultParts.push('_perItem');
        resultParts.push(Number(part));
      } else {
        resultParts.push(part);
      }
    }

    // Build lodash path string with array indices in [_perItem[index]] notation
    let finalPath = '';
    for (let i = 0; i < resultParts.length; i++) {
      const p = resultParts[i];
      if (
        p === '_perItem' &&
        i + 1 < resultParts.length &&
        typeof resultParts[i + 1] === 'number'
      ) {
        finalPath += `_perItem[${resultParts[i + 1]}]`;
        i++; // skip the index number next iteration
      } else {
        if (finalPath.length > 0) finalPath += '.';
        finalPath += p.toString();
      }
    }
    return finalPath;
  }

  public static getParentIdOrPath(idOrPath: string): string {
    return idOrPath.replace(/^(.*)(\.|_)[^._]+$/g, '$1');
  }

  public static formDataPathToRjsfId(
    formDataPath: string | Array<string | number>,
  ): string {
    const pathStr = _.isArray(formDataPath)
      ? formDataPath.join('.')
      : formDataPath;

    const rjsfPath = pathStr.replace(/\[(\d+)]/g, '_$1').replace(/\./g, '_');

    return `root_${rjsfPath}`;
  }

  public static resolveRelativeIdOrPath(
    idOrPath: string,
    relativePath: string,
  ): string {
    const isRjsfStyle = idOrPath.startsWith('root') && idOrPath.includes('_');
    const delimiter = isRjsfStyle ? '_' : '.';
    const baseSegments = idOrPath.split(delimiter);
    const relativeSegments = relativePath.split('/');

    const stack: string[] = [...baseSegments];
    for (const segment of relativeSegments) {
      if (segment === '..') stack.pop();
      else if (segment !== '.' && segment !== '') stack.push(segment);
    }

    return stack.join(delimiter);
  }

  public static getFormDataById(rootFormData: any, rjsfId: string): any {
    const lodashPath = RjsfUtils.rjsfIdToFormDataPath(rjsfId);
    return _.get(rootFormData, lodashPath);
  }

  public static setFormDataById(
    rootFormData: any,
    rjsfId: string,
    value: any,
  ): any {
    const lodashPath = RjsfUtils.rjsfIdToFormDataPath(rjsfId);
    _.set(rootFormData, lodashPath, value);
  }

  public static getUiSchemaById(rootUiSchema: any, rjsfId: string): any {
    // Legacy: without per-item index preservation
    const lodashPath = RjsfUtils.rjsfIdToUiSchemaPath(rjsfId);
    return _.get(rootUiSchema, lodashPath);
  }

  public static setUiSchemaById(
    rootUiSchema: any,
    rjsfId: string,
    value: any,
  ): any {
    // Legacy: without per-item index preservation
    const lodashPath = RjsfUtils.rjsfIdToUiSchemaPath(rjsfId);
    _.set(rootUiSchema, lodashPath, value);
  }

  /**
   * New: Get ui:options for a specific field, preserving array indexes
   * under items._perItem[index].ui:options
   */
  public static getUiSchemaItemByIndex(rootUiSchema: any, rjsfId: string): any {
    const lodashPath = this.rjsfIdToUiSchemaPerItemPath(rjsfId) + '.ui:options';
    return _.get(rootUiSchema, lodashPath);
  }

  /**
   * New: Set ui:options for a specific field, preserving array indexes
   * under items._perItem[index].ui:options
   */
  public static setUiSchemaItemByIndex(
    rootUiSchema: any,
    rjsfId: string,
    value: any,
  ): void {
    const lodashPath = this.rjsfIdToUiSchemaPerItemPath(rjsfId) + '.ui:options';
    _.set(rootUiSchema, lodashPath, value);
  }
}
export const getUiSchemaNodeAtPath = (uiSchema: any, path: string[]): any => {
  return path.reduce((node, segment) => {
    if (!node) return undefined;

    if (/^\d+$/.test(segment)) {
      return node.items || node[segment];
    }
    return node[segment];
  }, uiSchema);
};
const getSchemaNodeAtPath = (schema: any, path: string[]): any => {
  let currentSchema = schema;

  for (const segment of path) {
    if (!currentSchema) return null;

    if (currentSchema.$ref) {
      currentSchema = resolveRef(schema, currentSchema.$ref);
      if (!currentSchema) return null;
    }
    if (/^\d+$/.test(segment)) {
      if (currentSchema.type === 'array' || currentSchema.items) {
        currentSchema = currentSchema.items;
        continue;
      } else return null;
    }

    if (segment === '[*]') {
      currentSchema = currentSchema.items || null;
      continue;
    }
    if (currentSchema.anyOf || currentSchema.oneOf) {
      const branches = currentSchema.anyOf || currentSchema.oneOf;
      let foundSchema = null;
      for (const branch of branches) {
        if (branch.properties && segment in branch.properties) {
          foundSchema = branch.properties[segment];
          break;
        }
      }
      if (foundSchema) {
        currentSchema = foundSchema;
        continue;
      } else return null;
    }

    if (currentSchema.properties && segment in currentSchema.properties) {
      currentSchema = currentSchema.properties[segment];
    } else return null;
  }

  if (currentSchema?.$ref) {
    currentSchema = resolveRef(schema, currentSchema.$ref);
  }

  return currentSchema;
};

export const getNonDefiningSchemaFromPath = (
  schema: any,
  currentPath: string[],
): any => {
  const nonDefSchemaNode = getSchemaNodeAtPath(schema, [
    ...currentPath,
    'nonDefiningProperties',
  ]);
  if (!nonDefSchemaNode) return null;

  if (nonDefSchemaNode?.anyOf) {
    return nonDefSchemaNode;
  }

  if (nonDefSchemaNode.type === 'array' && nonDefSchemaNode.items?.$ref) {
    return resolveRef(schema, nonDefSchemaNode.items?.$ref);
  }

  return null;
};

export const evaluateExpression = (
  expression: string,
  context: { formData: any },
): boolean => {
  try {
    // Handle logical OR (`||`)
    if (expression.includes('||')) {
      return expression
        .split('||')
        .map(part => part.trim())
        .some(expr => evaluateSingleExpression(expr, context));
    }

    // Handle logical AND (`&&`)
    if (expression.includes('&&')) {
      return expression
        .split('&&')
        .map(part => part.trim())
        .every(expr => evaluateSingleExpression(expr, context));
    }

    // Single expression case
    return evaluateSingleExpression(expression.trim(), context);
  } catch (error) {
    console.error('evaluateExpression - error:', {
      expression,
      error,
      formData: context.formData,
    });
    return false;
  }
};

function evaluateSingleExpression(
  expression: string,
  context: { formData: any },
) {
  if (expression.endsWith('?.length > 0')) {
    let path = expression
      .replace(/^formData\./, '')
      .replace(/\?.length > 0$/, '');
    path = path.replace(/\?\.\[/g, '[').replace(/\?\./g, '.');
    const value = get(context.formData, path);
    return typeof value === 'string' && value.length > 0;
  }
  return false;
}
