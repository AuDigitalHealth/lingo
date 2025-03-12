import React, { useState, useEffect } from 'react';
import { FieldProps } from '@rjsf/utils';
import { Box, IconButton, Tooltip } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const NewPackSizeInputField: React.FC<FieldProps> = (props) => {
    const { formData, onChange, formContext, schema, uiSchema, registry } = props;

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
            setInputValue({ packSize: undefined, externalIdentifiers: [] });
            onChange({ packSize: undefined, externalIdentifiers: [] });
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

    const { fields } = registry;
    const { ObjectField } = fields;

    const isAddDisabled = !inputValue.packSize || isPackSizeDuplicate() || isNaN(inputValue.packSize);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ flexGrow: 1, border: 1, borderColor: 'grey.300', p: 1, borderRadius: 1 }}>
                <ObjectField
                    {...props}
                    formData={inputValue}
                    onChange={(newValue) => {
                        setInputValue(newValue);
                        onChange(newValue);
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