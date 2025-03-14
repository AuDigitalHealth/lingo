import React, { useState, useEffect } from 'react';
import { FieldProps } from '@rjsf/utils';
import { Box, IconButton, Tooltip } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const NewPackSizeInputField: React.FC<FieldProps> = (props) => {
    const { formData, onChange, formContext, schema, uiSchema, registry, errorSchema } = props;

    const [inputValue, setInputValue] = useState(formData || { packSize: undefined, externalIdentifiers: [] });

    useEffect(() => {
        setInputValue(formData || { packSize: undefined, externalIdentifiers: [] });
    }, [formData]);

    const handleAdd = () => {
        if (inputValue.packSize && !isNaN(inputValue.packSize)) {
            const currentFormData = { ...formContext.formData };
            const currentPackSizes = Array.isArray(currentFormData.packSizes) ? [...currentFormData.packSizes] : [];
            const newPackSize = { ...inputValue };
            const updatedPackSizes = [...currentPackSizes, newPackSize];
            const updatedFormData = {
                ...currentFormData,
                packSizes: updatedPackSizes,
                newPackSizeInput: { packSize: undefined, externalIdentifiers: [] },
            };

            formContext.onChange(updatedFormData);
        }
    };

    const isPackSizeDuplicate = () => {
        if (!inputValue.packSize) return false;

        const allPackSizes = [
            ...(formContext.formData.existingPackSizes || []),
            ...(formContext.formData.packSizes || []),
        ];

        return allPackSizes.some((packSize) => packSize?.packSize === inputValue.packSize);
    };

    const isPackSizeValid = () => {
        const packSizeErrors = errorSchema?.packSize?.__errors || [];
        const hasErrors = packSizeErrors.length > 0;
        return inputValue.packSize !== undefined && !hasErrors;
    };

    const enforceMinimumValue = (newValue: any) => {
        const packSize = newValue.packSize;
        const minimum = schema.properties?.packSize?.minimum || 1; // Default to 1 if not specified

        if (packSize === undefined || (Number.isInteger(packSize) && packSize >= minimum)) {
            return newValue;
        }
        return {
            ...newValue,
            packSize: packSize < minimum || !Number.isInteger(packSize) ? inputValue.packSize : packSize,
        };
    };

    const { fields } = registry;
    const { ObjectField } = fields;

    const isAddDisabled = !isPackSizeValid() || isPackSizeDuplicate();

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ flexGrow: 1, border: 1, borderColor: 'grey.300', p: 1, borderRadius: 1 }}>
                <ObjectField
                    {...props}
                    formData={inputValue}
                    onChange={(newValue) => {
                        const clampedValue = enforceMinimumValue(newValue);
                        setInputValue(clampedValue);
                        onChange(clampedValue);
                    }}
                />
            </Box>
            <Tooltip title="Add Pack Size">
                <span>
                    <IconButton
                        onClick={handleAdd}
                        disabled={isAddDisabled}
                        color="primary"
                        aria-label="Add Pack Size"
                    >
                        <AddCircleOutlineIcon />
                    </IconButton>
                </span>
            </Tooltip>
        </Box>
    );
};

export default NewPackSizeInputField;