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
