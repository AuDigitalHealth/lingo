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

import { useEffect, useState } from 'react';
import { ConceptMini } from '../../../../types/concept.ts';
import { RjsfUtils } from '../helpers/rjsfUtils.ts';

export const useExclusionUpdates = (
  uiSchema: any,
  idSchema: any,
  formContext: any,
  rootFormData: any,
  rootUiSchema: any,
  formData: any,
) => {
  // @ts-ignore
  const [exclusions] = useState(
    (uiSchema && uiSchema['ui:options']?.exclusions) || [],
  );
  const configureExclusionUiSchema = (
    dependantDefinition: any,
    dependantInstance: any,
    disable: boolean,
  ) => {
    const dependantUiSchema = { ...dependantInstance };
    if (!dependantUiSchema['ui:options']) {
      dependantUiSchema['ui:options'] = {};
    }
    dependantUiSchema['ui:options'].disabled = disable;
    return dependantUiSchema;
  };
  const updateExclusions = (value: ConceptMini | null) => {
    if (exclusions && exclusions.length > 0) {
      // @ts-ignore
      const parentValueSelected = !!(
        formData &&
        formData?.conceptId &&
        !formData?.conceptId?.match(/^$/)
      );
      for (const dependant of exclusions as any[]) {
        // @ts-ignore
        const dependantId = RjsfUtils.resolveRelativeIdOrPath(
          idSchema.$id,
          dependant.path,
        );
        // @ts-ignore
        const dependantInstance = RjsfUtils.getUiSchemaById(
          formContext.uiSchema,
          dependantId,
        );
        const newUiSchema = configureExclusionUiSchema(
          dependant,
          dependantInstance,
          parentValueSelected,
        );
        const defaultValue = newUiSchema.defaultValue || null;
        if (newUiSchema.anyOf) {
          const subSchemas = [...newUiSchema.anyOf];
          newUiSchema.anyOf = [];
          for (const subSchema of subSchemas) {
            // @ts-ignore
            newUiSchema.anyOf.push(
              configureExclusionUiSchema(
                dependant,
                subSchema,
                parentValueSelected,
              ),
            );
          }
        }
        RjsfUtils.setFormDataById(rootFormData, dependantId, defaultValue);
        RjsfUtils.setUiSchemaById(rootUiSchema, dependantId, newUiSchema);
      }
    }
  };
  useEffect(() => {
    // @ts-ignore
    updateExclusions(formData);
  }, [formData]);

  return;
};

export default useExclusionUpdates;
