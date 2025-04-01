import React, { useState, useEffect } from 'react';
import { FieldProps } from '@rjsf/core';
import { Box } from '@mui/material';
import AutoCompleteField from './AutoCompleteField.tsx';
import { ConceptMini } from "../../../../types/concept.ts";
import _ from 'lodash';
import { getFieldName, getParentPath } from "../helpers/helpers.ts";
import { getFieldErrors, getUniqueErrors } from "../helpers/errorUtils.ts";
import { ErrorDisplay } from "../components/ErrorDisplay.tsx";

const ParentChildAutoCompleteField = ({
                                          formData,
                                          uiSchema,
                                          errorSchema = {},
                                          registry,
                                          formContext,
                                          idSchema,
                                          rawErrors
                                      }: FieldProps) => {
    const {
        parentFieldName = '',
        childFieldName = '',
        parentFieldOptions,
        childFieldOptions,
    } = uiSchema['ui:options'] || {};

    const fieldName = getFieldName(idSchema);
    const parentPath = getParentPath(fieldName);
    const rootFormData = _.get(registry, 'rootSchema.formData', formContext?.formData || formData || {});

    // Get the current data at parentPath to preserve other fields
    const currentData = _.get(rootFormData, parentPath) || {};

    const initialParentValue = _.get(currentData, parentFieldName) || null;
    const initialChildValue = _.get(currentData, childFieldName) || null;

    const [parentValue, setParentValue] = useState<ConceptMini | null>(initialParentValue);
    const [childValue, setChildValue] = useState<ConceptMini | null>(initialChildValue);
    const [childEcl, setChildEcl] = useState(childFieldOptions?.ecl || '');
    const [isChildDisabled, setIsChildDisabled] = useState(!initialParentValue);

    useEffect(() => {
        if (parentValue?.conceptId && childFieldOptions?.getEcl) {
            const updatedEcl = childFieldOptions.getEcl.replace(
                /@parent/gi,
                parentValue.conceptId
            );
            setChildEcl(updatedEcl);
            setIsChildDisabled(false);
        } else {
            setChildEcl('');
            setChildValue(null);
            setIsChildDisabled(true);
        }
    }, [parentValue, childFieldOptions]);

    const handleParentChange = (newValue: ConceptMini | null) => {
        setParentValue(newValue);

        const newRootFormData = _.cloneDeep(rootFormData);
        let updatedData = { ...currentData };

        if (newValue) {
            // Set parent field, keep child if it exists
            updatedData[parentFieldName] = newValue;
            setIsChildDisabled(false);
        } else {
            // Remove parent and child fields when parent is cleared
            updatedData = _.omit(updatedData, [parentFieldName, childFieldName]);
            setChildValue(null);
            setChildEcl('');
            setIsChildDisabled(true);
        }

        _.set(newRootFormData, parentPath, updatedData);
        formContext?.onChange(newRootFormData);
    };

    const handleChildChange = (newValue: ConceptMini | null) => {
        setChildValue(newValue);

        const newRootFormData = _.cloneDeep(rootFormData);
        let updatedData = { ...currentData };

        if (newValue) {
            // Set child field, ensure parent is included
            updatedData[childFieldName] = newValue;
            updatedData[parentFieldName] = parentValue; // Parent must exist if child is set
        } else {
            // Remove child field, keep parent
            updatedData = _.omit(updatedData, childFieldName);
        }

        _.set(newRootFormData, parentPath, updatedData);
        formContext?.onChange(newRootFormData);
    };

    const parentErrors = getUniqueErrors(rawErrors, errorSchema);
    const childErrors = getFieldErrors(formContext?.errorSchema || {}, `${parentPath}.${childFieldName}`);

    return (
        <Box>
            <Box mb={3}>
                <AutoCompleteField
                    schema={{ title: parentFieldOptions?.title }}
                    uiSchema={{ 'ui:options': parentFieldOptions }}
                    formData={parentValue}
                    onChange={handleParentChange}
                    errorSchema={errorSchema}
                />
                <ErrorDisplay errors={parentErrors} />
            </Box>

            <Box>
                <AutoCompleteField
                    schema={{ title: childFieldOptions?.title }}
                    uiSchema={{
                        'ui:widget': 'hidden',
                        'ui:options': {
                            ...childFieldOptions,
                            ecl: childEcl,
                            disabled: isChildDisabled,
                        },
                    }}
                    formData={childValue}
                    onChange={handleChildChange}
                />
                <ErrorDisplay errors={childErrors} />
            </Box>
        </Box>
    );
};

export default ParentChildAutoCompleteField;