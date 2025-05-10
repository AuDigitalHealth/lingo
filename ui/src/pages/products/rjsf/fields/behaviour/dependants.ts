import {useEffect, useState} from "react";
import _ from "lodash";
import {ConceptMini} from "../../../../../types/concept.ts";
import {RjsfUtils} from "../../helpers/rjsfUtils.ts";

export const updateDependants = (uiSchema: {}, idSchema: any, formContext: {}, rootFormData: any, rootUiSchema: any, formData: {}) => {
    // @ts-ignore
    const [dependants] = useState(uiSchema && uiSchema['ui:options']?.dependants || []);
    const configureDependantUiSchema = (dependantDefinition: any, dependantInstance: any, parentConceptId: string | undefined) => {
        let dependantUiSchema = {...dependantInstance, ..._.omit(dependantDefinition, ['path', 'anyOf'])};
        if (!dependantUiSchema['ui:options']) {
            dependantUiSchema['ui:options'] = {};
        }
        if (parentConceptId) {
            if (dependantUiSchema['ui:options']?.getEcl) {
                dependantUiSchema['ui:options'].ecl = dependantUiSchema['ui:options']?.getEcl.replace(
                    /@parent/gi,
                    parentConceptId,
                );
            }
            dependantUiSchema['ui:options'].disabled = false;
            if (dependantUiSchema['ui:options'].ecl && !dependantUiSchema['ui:options'].origEcl) {
                dependantUiSchema['ui:options'].origEcl = dependantInstance['ui:options']?.ecl;
            }
        } else {
            if (dependantUiSchema['ui:options'].origEcl) {
                dependantUiSchema['ui:options'].ecl = dependantUiSchema['ui:options'].origEcl;
            } else {
                dependantUiSchema['ui:options'].ecl = '';
            }
            dependantUiSchema['ui:options'].disabled = true;
        }
        return dependantUiSchema;
    };
    const updateDependants = (value: ConceptMini | null) => {
        if (dependants && dependants.length > 0) {
            for (const dependant of dependants as any[]) {
                // @ts-ignore
                const dependantId = RjsfUtils.resolveRelativeIdOrPath(idSchema.$id, dependant.path);
                // @ts-ignore
                const dependantInstance = RjsfUtils.getUiSchemaById(formContext.uiSchema, dependantId);
                let newUiSchema = configureDependantUiSchema(dependant, dependantInstance, value?.conceptId);
                if (newUiSchema.anyOf) {
                    const subSchemas = [...newUiSchema.anyOf];
                    newUiSchema.anyOf = [];
                    for (const subSchema of subSchemas) {
                        newUiSchema.anyOf.push(configureDependantUiSchema(dependant, subSchema, value?.conceptId));
                    }
                }
                RjsfUtils.setFormDataById(rootFormData, dependantId, null);
                RjsfUtils.setUiSchemaById(rootUiSchema, dependantId, newUiSchema);
                // @ts-ignore
                if ((!value || !value.conceptId) && formContext?.onChange) {
                    // @ts-ignore
                    formContext.onChange(rootFormData);
                }
            }
        }
    };
    useEffect(() => {
        // @ts-ignore
        updateDependants(formData);
    }, [formData]);
};

export const updateExclusions = (uiSchema: {}, idSchema: any, formContext: {}, rootFormData: any, rootUiSchema: any, formData: {}) => {
    // @ts-ignore
    const [exclusions] = useState(uiSchema && uiSchema['ui:options']?.exclusions || []);
    const configureExclusionUiSchema = (dependantDefinition: any, dependantInstance: any, disable: boolean) => {
        let dependantUiSchema = {...dependantInstance};
        if (!dependantUiSchema['ui:options']) {
            dependantUiSchema['ui:options'] = {};
        }
        dependantUiSchema['ui:options'].disabled = disable;
        return dependantUiSchema;
    };
    const updateExclusions = (value: ConceptMini | null) => {
        if (exclusions && exclusions.length > 0) {
            for (const dependant of exclusions as any[]) {
                // @ts-ignore
                const dependantId = RjsfUtils.resolveRelativeIdOrPath(idSchema.$id, dependant.path);
                // @ts-ignore
                const dependantInstance = RjsfUtils.getUiSchemaById(formContext.uiSchema, dependantId);
                let newUiSchema = configureExclusionUiSchema(dependant, dependantInstance, (value && value?.conceptId ? true : false));
                if (newUiSchema.anyOf) {
                    const subSchemas = [...newUiSchema.anyOf];
                    newUiSchema.anyOf = [];
                    for (const subSchema of subSchemas) {
                        newUiSchema.anyOf.push(configureExclusionUiSchema(dependant, subSchema, (value && value?.conceptId ? true : false)));
                    }
                }
                RjsfUtils.setFormDataById(rootFormData, dependantId, null);
                RjsfUtils.setUiSchemaById(rootUiSchema, dependantId, newUiSchema);
                // @ts-ignore
                if ((value && value?.conceptId) && formContext?.onChange) {
                    RjsfUtils.setFormDataById(rootFormData, idSchema.$id, formData);
                    // @ts-ignore
                    formContext.onChange({...rootFormData});
                }
            }
        }
    };
    useEffect(() => {
        // @ts-ignore
        updateExclusions(formData);
    }, [formData]);
};

