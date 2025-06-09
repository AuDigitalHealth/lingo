import { useEffect, useState } from 'react';
import _ from 'lodash';
import { RjsfUtils } from '../helpers/rjsfUtils.ts';

export const useDependantUpdates = (
  uiSchema: any,
  idSchema: any,
  formContext: any,
  rootFormData: any,
  rootUiSchema: any,
  formData: any,
) => {
  // @ts-ignore
  const [dependants] = useState(
    (uiSchema && uiSchema['ui:options']?.dependants) || [],
  );
  const configureDependantUiSchema = (
    dependantDefinition: any,
    dependantInstance: any,
    parentConceptId: string | undefined,
  ) => {
    const dependantUiSchema = {
      ...dependantInstance,
      ..._.omit(dependantDefinition, ['path', 'anyOf']),
    };
    if (!dependantUiSchema['ui:options']) {
      dependantUiSchema['ui:options'] = {};
    }
    if (parentConceptId) {
      if (
        dependantUiSchema['ui:options'].ecl &&
        !dependantUiSchema['ui:options'].origEcl
      ) {
        dependantUiSchema['ui:options'].origEcl =
          dependantInstance['ui:options']?.ecl;
      }
      if (dependantUiSchema['ui:options']?.getEcl) {
        dependantUiSchema['ui:options'].ecl = dependantUiSchema[
          'ui:options'
        ]?.getEcl.replace(/@parent/gi, parentConceptId);
      }
      dependantUiSchema['ui:options'].disabled = false;
    } else {
      if (dependantUiSchema['ui:options'].origEcl) {
        dependantUiSchema['ui:options'].ecl =
          dependantUiSchema['ui:options'].origEcl;
      } else {
        dependantUiSchema['ui:options'].ecl = '';
      }
      dependantUiSchema['ui:options'].disabled = true;
    }
    return dependantUiSchema;
  };
  const updateDependants = () => {
    if (dependants && dependants.length > 0) {
      // @ts-ignore
      const parentValueSelected = !!(
        formData &&
        formData?.conceptId &&
        !formData?.conceptId?.match(/^$/)
      );
      for (const dependant of dependants as any[]) {
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
        // @ts-ignore
        const newUiSchema = configureDependantUiSchema(
          dependant,
          dependantInstance,
          formData?.conceptId,
        );
        const defaultValue = newUiSchema.defaultValue || null;
        if (newUiSchema.anyOf) {
          const subSchemas = [...newUiSchema.anyOf];
          newUiSchema.anyOf = [];
          for (const subSchema of subSchemas) {
            // @ts-ignore
            newUiSchema.anyOf.push(
              configureDependantUiSchema(
                dependant,
                subSchema,
                formData?.conceptId,
              ),
            );
          }
        }
        RjsfUtils.setFormDataById(rootFormData, dependantId, defaultValue);
        RjsfUtils.setUiSchemaById(rootUiSchema, dependantId, {
          ...newUiSchema,
        });
      }
    }
  };
  useEffect(() => {
    // @ts-ignore
    updateDependants(formData);
  }, [formData]);

  return;
};

export default useDependantUpdates;
