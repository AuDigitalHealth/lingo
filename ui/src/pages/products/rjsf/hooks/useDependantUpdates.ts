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
  const [dependants] = useState<Dependant[]>(
    uiSchema?.['ui:options']?.dependants || [],
  );

  const configureDependantUiSchema = (
    dependantDefinition: Dependant,
    dependantInstance: UiSchema,
    parentConceptId?: string,
  ): UiSchema => {
    const uiOptions = {
      ...dependantInstance['ui:options'],
      ...dependantDefinition['ui:options'],
    };

    const dependantUiSchema: UiSchema = {
      ...dependantInstance,
      ..._.omit(dependantDefinition, ['path', 'anyOf']),
      'ui:options': uiOptions,
    };

    if (parentConceptId) {
      // Handle ECL configuration
      if (uiOptions?.getEcl) {
        if (uiOptions.ecl && !uiOptions.origEcl) {
          uiOptions.origEcl = dependantInstance['ui:options']?.ecl;
        }
        uiOptions.ecl = uiOptions.getEcl.replace(/@parent/gi, parentConceptId);
      }

      // Handle Extended ECL configuration
      if (uiOptions?.getExtendedEcl) {
        if (uiOptions.extendedEcl && !uiOptions.origExtendedEcl) {
          uiOptions.origExtendedEcl =
            dependantInstance['ui:options']?.extendedEcl;
        }
        uiOptions.extendedEcl = uiOptions.getExtendedEcl.replace(
          /@parent/gi,
          parentConceptId,
        );
      }

      uiOptions.disabled = false;
    } else {
      // Reset ECL when no parentConceptId
      if (uiOptions?.getEcl) {
        uiOptions.ecl = uiOptions.origEcl ?? '';
      }

      // Reset Extended ECL when no parentConceptId
      if (uiOptions?.getExtendedEcl && !uiOptions?.extendedEcl) {
        uiOptions.extendedEcl =
          uiOptions.origExtendedEcl ?? uiOptions.getExtendedEcl ?? '';
      }

      uiOptions.disabled = true;
    }

    return dependantUiSchema;
  };
  const getUiSchemaFromAnyOf = (uiSchema: any, dependantId: string) => {
    const anyOf = uiSchema.anyOf;
    if (!Array.isArray(anyOf)) return undefined;

    for (const option of anyOf) {
      const maybe = RjsfUtils.getUiSchemaById(option, dependantId);
      if (maybe) return maybe;
    }
    return undefined;
  };
  const updateDependants = () => {
    if (!dependants?.length) return;

    const parentValueSelected =
        !!formData?.conceptId && !formData.conceptId.match(/^$/);

    for (const dependant of dependants) {
      const dependantId = RjsfUtils.resolveRelativeIdOrPath(
          idSchema.$id,
          dependant.path,
      );
      if (!dependantId) continue;

      let dependantInstance = RjsfUtils.getUiSchemaById(
          formContext.uiSchema,
          dependantId,
      );

      let anyOfIndex: number | null = null;

      // Fallback: search inside anyOf array
      if (!dependantInstance && Array.isArray(formContext.uiSchema?.anyOf)) {
        for (let i = 0; i < formContext.uiSchema.anyOf.length; i++) {
          const sub = formContext.uiSchema.anyOf[i];
          const maybe = RjsfUtils.getUiSchemaById(sub, dependantId);
          if (maybe) {
            dependantInstance = maybe;
            anyOfIndex = i;
            break;
          }
        }
      }

      if (!dependantInstance) {
        console.warn('Could not locate dependant UI schema:', dependantId);
        continue;
      }

      const newUiSchema = configureDependantUiSchema(
          dependant,
          dependantInstance,
          parentValueSelected ? formData?.conceptId : undefined,
      );

      // Preserve sub-dependants
      const options = dependantInstance['ui:options'] ?? {};
      newUiSchema['ui:options'] ??= {};
      if (options.dependants)
        newUiSchema['ui:options'].dependants = options.dependants;
      if (options.showDefaultOptions)
        newUiSchema['ui:options'].showDefaultOptions = options.showDefaultOptions;

      // Handle nested anyOfs
      if (newUiSchema.anyOf) {
        newUiSchema.anyOf = newUiSchema.anyOf.map(sub =>
            configureDependantUiSchema(
                dependant,
                sub,
                parentValueSelected ? formData?.conceptId : undefined,
            ),
        );
      }

      // Update form data
      RjsfUtils.setFormDataById(
          formContext.formData,
          dependantId,
          newUiSchema.defaultValue ?? null,
      );

      // Update the correct uiSchema: either main or inside anyOf
      if (anyOfIndex !== null) {
        const anyOfUiSchema = formContext.uiSchema.anyOf[anyOfIndex];
        RjsfUtils.setUiSchemaById(anyOfUiSchema, dependantId, newUiSchema);
      } else {
        RjsfUtils.setUiSchemaById(formContext.uiSchema, dependantId, newUiSchema);
      }
    }
  };


  useEffect(() => {
    updateDependants();
  }, [formData]);

  return null;
};

export default useDependantUpdates;
