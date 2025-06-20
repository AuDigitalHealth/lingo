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

  const updateDependants = () => {
    if (!dependants?.length) return;

    const parentValueSelected =
      !!formData?.conceptId && !formData.conceptId.match(/^$/);

    for (const dependant of dependants) {
      const dependantId = RjsfUtils.resolveRelativeIdOrPath?.(
        idSchema.$id,
        dependant.path,
      );
      if (!dependantId) continue;

      const dependantInstance = RjsfUtils.getUiSchemaById?.(
        formContext.uiSchema,
        dependantId,
      );
      if (!dependantInstance) continue;

      const newUiSchema = configureDependantUiSchema(
        dependant,
        dependantInstance,
        parentValueSelected ? formData?.conceptId : undefined,
      );

      // Preserve sub-dependants
      if (dependantInstance['ui:options']?.dependants) {
        newUiSchema['ui:options'].dependants =
          dependantInstance['ui:options'].dependants;
      }

      // Handle anyOf sub-schemas
      if (newUiSchema.anyOf) {
        newUiSchema.anyOf = newUiSchema.anyOf.map(subSchema =>
          configureDependantUiSchema(
            dependant,
            subSchema,
            parentValueSelected ? formData?.conceptId : undefined,
          ),
        );
      }

      // Update form data and UI schema
      RjsfUtils.setFormDataById?.(
        rootFormData,
        dependantId,
        newUiSchema.defaultValue ?? null,
      );
      RjsfUtils.setUiSchemaById?.(rootUiSchema, dependantId, newUiSchema);
    }
  };

  useEffect(() => {
    updateDependants();
  }, [formData]);

  return null;
};

export default useDependantUpdates;
