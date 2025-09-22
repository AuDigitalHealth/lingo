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

import { useState, useEffect } from 'react';
import _ from 'lodash';
import { RjsfUtils } from '../helpers/rjsfUtils';

interface UiSchemaOptions {
  dependants?: Dependant[];
  getEcl?: string;
  ecl?: string;
  origEcl?: string;
  getExtendedEcl?: string;
  extendedEcl?: string;
  origExtendedEcl?: string;
  disabled?: boolean;
  defaultValue?: any;
  showDefaultOptions?: boolean;
}

interface UiSchema {
  'ui:options'?: UiSchemaOptions;
  anyOf?: any[];
  [key: string]: any;
}

interface Dependant {
  path: string;
  anyOf?: any[];
  defaultValue?: any;
  'ui:options'?: UiSchemaOptions;
  [key: string]: any;
}

interface FormData {
  conceptId?: string;
}

interface IdSchema {
  $id: string;
}

interface FormContext {
  uiSchema: UiSchema;
}

export const useDependantUpdates = (
  uiSchema: UiSchema,
  idSchema: IdSchema,
  formContext: FormContext,
  rootFormData: any,
  rootUiSchema: UiSchema,
  formData: FormData,
) => {
  const dependants: Dependant[] = uiSchema?.['ui:options']?.dependants || [];

  const updateDependants = () => {
    if (!dependants?.length) return;

    const parentValueSelected = !!formData?.conceptId;

    for (const dependant of dependants) {
      const dependantId = RjsfUtils.resolveRelativeIdOrPath(
        idSchema.$id,
        dependant.path,
      );
      if (!dependantId) continue;

      const dependantInstance = _.cloneDeep(
        RjsfUtils.getUiSchemaItemByIndex(formContext.uiSchema, dependantId) ||
          {},
      );

      const newUiOptions = _.cloneDeep(dependantInstance['ui:options'] || {});
      const dependantOptions = _.cloneDeep(dependant['ui:options'] || {});
      const mergedOptions = { ...newUiOptions, ...dependantOptions };

      if (parentValueSelected) {
        if (mergedOptions?.getEcl) {
          mergedOptions.origEcl =
            mergedOptions.origEcl || newUiOptions.ecl || '';
          mergedOptions.ecl = mergedOptions.getEcl.replace(
            /@parent/gi,
            formData.conceptId!,
          );
        }
        if (mergedOptions?.getExtendedEcl) {
          mergedOptions.origExtendedEcl =
            mergedOptions.origExtendedEcl || newUiOptions.extendedEcl || '';
          mergedOptions.extendedEcl = mergedOptions.getExtendedEcl.replace(
            /@parent/gi,
            formData.conceptId!,
          );
        }
        mergedOptions.disabled = false;
      } else {
        mergedOptions.ecl = mergedOptions.origEcl || '';
        mergedOptions.extendedEcl = mergedOptions.origExtendedEcl || '';
        mergedOptions.disabled = true;
      }

      const finalUiOptions = {
        ...dependantInstance['ui:options'],
        ...mergedOptions,
      };

      const newUiSchema = {
        'ui:options': finalUiOptions,
      };
      RjsfUtils.setUiSchemaItemByIndex(rootUiSchema, dependantId, newUiSchema);
    }
  };

  useEffect(() => {
    updateDependants();
  }, [formData]);

  return null;
};

export default useDependantUpdates;
