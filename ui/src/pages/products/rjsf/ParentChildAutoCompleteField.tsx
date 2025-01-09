import React, { useState, useEffect } from "react";
import { FieldProps } from "@rjsf/core";
import AutoCompleteField from "./AutoCompleteField"; // Assume this is a reusable Autocomplete component
import { Box } from "@mui/material";

const ParentChildAutoCompleteField = ({
                                          formData,
                                          uiSchema,
                                          onChange,
                                      }: FieldProps) => {
    const { parentFieldName, childFieldName, parentFieldOptions, childFieldOptions } =
    uiSchema["ui:options"] || {};

    const [parentValue, setParentValue] = useState(formData?.[parentFieldName]);
    const [childValue, setChildValue] = useState(formData?.[childFieldName]);
    const [childEcl, setChildEcl] = useState(childFieldOptions?.ecl || "");
    const [isChildDisabled, setIsChildDisabled] = useState(!parentValue);

    // Update child ECL dynamically when parentValue changes
    useEffect(() => {
        if (parentValue && parentValue.conceptId && childFieldOptions?.getEcl) {
            const updatedEcl = childFieldOptions.getEcl.replace(
                /@parent/gi,
                parentValue?.conceptId || ""
            );
            setChildEcl(updatedEcl);
            setIsChildDisabled(false); // Enable child field when parent has a value
        } else {
            // Reset child ECL and disable child field when parentValue is cleared
            setChildEcl("");
            setChildValue(null);
            setIsChildDisabled(true);
        }
    }, [parentValue, childFieldOptions]);

    // Handle parent field change
    const handleParentChange = (newValue: any) => {
        setParentValue(newValue);

        if (!newValue) {
            // Clear and disable child field when parent is cleared
            setChildValue(null);
            setChildEcl("");
            setIsChildDisabled(true);
            onChange({
                ...formData,
                [parentFieldName]: null,
                [childFieldName]: null,
            });
        } else {
            setChildValue(null); // Reset child value when parent changes
            setIsChildDisabled(false);
            onChange({
                ...formData,
                [parentFieldName]: newValue,
                [childFieldName]: null,
            });
        }
    };

    // Handle child field change
    const handleChildChange = (newValue: any) => {
        setChildValue(newValue);
        onChange({
            ...formData,
            [parentFieldName]: parentValue,
            [childFieldName]: newValue,
        });
    };

    return (
        <Box>
            {/* Parent Field */}
            <Box mb={3}>
                <AutoCompleteField
                    schema={{ title: parentFieldOptions?.title }}
                    uiSchema={{ "ui:options": parentFieldOptions }}
                    formData={parentValue}
                    onChange={handleParentChange}
                />
            </Box>

            {/* Child Field */}
            <Box>
                <AutoCompleteField
                    schema={{ title: childFieldOptions?.title }}
                    uiSchema={{
                        "ui:options": { ...childFieldOptions, ecl: childEcl,disabled:isChildDisabled },
                    }}
                    formData={childValue}
                    onChange={handleChildChange}
                />
            </Box>
        </Box>
    );
};

export default ParentChildAutoCompleteField;
