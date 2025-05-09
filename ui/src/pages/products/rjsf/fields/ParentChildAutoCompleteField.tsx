import React, { useState, useEffect } from 'react';
import { FieldProps } from '@rjsf/utils';
import AutoCompleteField from './AutoCompleteField';
import _ from 'lodash';
import { ConceptMini } from "../../../../types/concept.ts";
import { getParentPath,
getUiSchemaPath,
getFormDataById,
    getUiSchemaById,
    setFormDataById,
    setUiSchemaById,
    getItemTitle,
    getFieldName,

} from "../helpers/helpers.ts";
import {RjsfUtils} from "../helpers/rjsfUtils.ts";

const ParentChildAutoCompleteField: React.FC<FieldProps<any, any>> = (props) => {
    const { formData, formContext, registry, onChange, uiSchema, idSchema, schema } = props;
    const opts = uiSchema && uiSchema['ui:options'] || {};
    const { childFieldName, childFieldOptions } = opts;
    // const commonParentPath = getParentPath(idSchema.$id).replaceAll("root.", "");

    const stringify = (obj: any) => {
        let cache: any[] = [];
        let str = JSON.stringify(obj, function(key, value) {
            if (typeof value === "object" && value !== null) {
                if (cache.indexOf(value) !== -1) {
                    // Circular reference found, discard key
                    return;
                }
                // Store value in our collection
                cache.push(value);
            }
            return value;
        });
        // cache = null; // reset the cache
        return str;
    };

    // @ts-ignore
    console.log(RjsfUtils.getFormDataById(formContext.formData, idSchema.$id));

    const rootFormData = _.get(
        registry,
        'rootSchema.formData',
        formContext?.formData || formData || {},
    );

    const commonParentFormData = _.get(rootFormData, commonParentPath) || {};
    const initialChildFormData = _.get(commonParentFormData, childFieldName) || {};

    const [parentFormData, setParentFormData] = useState(formData);
    const [childFormData, setChildFormData] = useState(initialChildFormData);

    // Update parent formData and trigger the onChange event for the parent component
    const handleSelect = (conceptMini: ConceptMini | null) => {
        const newFormData = conceptMini || {
            conceptId: '',
            pt: undefined,
            fsn: undefined,
        } as ConceptMini;



        // Update the parent form data
        setParentFormData(newFormData);

        // Dynamically update child field options based on parent selection
        let childEcl = '';
        if (newFormData?.conceptId) {
            // Replace @parent in the ECL expression
            childEcl = childFieldOptions?.getEcl
                ? childFieldOptions?.getEcl.replace(/@parent/g, newFormData?.conceptId)
                : '';
        }

        // Update the child form data (optional depending on your logic)
        setChildFormData({
            conceptId: '',
            pt: undefined,
            fsn: undefined,
        } as ConceptMini);

        // Dynamically modify the UI schema for the child field
        // You should update formContext or pass new uiSchema to the parent component
        const updatedUiSchema = {
            ...uiSchema,
            [childFieldName]: {
                ...uiSchema[childFieldName],
                'ui:options': {
                    ...childFieldOptions,
                    ecl: childEcl,
                    disabled: !newFormData?.conceptId,  // Disable the child field if no conceptId in parent
                }
            }
        };

        // This will inform the parent component that the UI schema has been updated
        // If you need to use the updated UI schema in parent, pass `updatedUiSchema` via context or directly
        console.log('Updated UI Schema:', updatedUiSchema);

        // Call onChange to update parent component formData
        onChange(newFormData);
    };

    return (
        <span data-component-name="ParentChildAutoCompleteField">
            <div>
                <AutoCompleteField
                    {...props}
                    onChange={handleSelect}
                    value={parentFormData} // Ensure that the AutoCompleteField uses the latest formData
                />
            </div>
        </span>
    );
};

export default ParentChildAutoCompleteField;
