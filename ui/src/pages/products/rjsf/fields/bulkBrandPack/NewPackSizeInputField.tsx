import React, { useState, useEffect } from 'react';
import { FieldProps } from '@rjsf/utils';
import { Box, IconButton, Tooltip } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const NewPackSizeInputField: React.FC<FieldProps> = props => {
  const { formData, onChange, formContext, schema, registry, errorSchema } =
    props;

  const [inputValue, setInputValue] = useState(
    formData || { packSize: undefined, externalIdentifiers: [] },
  );

  useEffect(() => {
    setInputValue(formData || { packSize: undefined, externalIdentifiers: [] });
  }, [formData]);

  const handleAdd = () => {
    if (inputValue.packSize !== undefined && !isNaN(inputValue.packSize)) {
      const currentFormData = { ...formContext.formData };
      const currentPackSizes = Array.isArray(currentFormData.packSizes)
        ? [...currentFormData.packSizes]
        : [];
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

    return allPackSizes.some(
      packSize => packSize?.packSize === inputValue.packSize,
    );
  };

  const isPackSizeValid = () => {
    const packSizeErrors = errorSchema?.packSize?.__errors || [];
    const hasErrors = packSizeErrors.length > 0;
    return inputValue.packSize !== undefined && !hasErrors;
  };

  const enforceSchemaConstraints = (newValue: any) => {
    const packSize = newValue.packSize;
    const packSizeSchema = schema.properties?.packSize || {};

    // Allow undefined to clear the field
    if (packSize === undefined) {
      return newValue;
    }

    // Use the validator from registry.formContext to validate packSize against its schema
    const validator = registry.formContext?.validator || registry.validator;
    const rootSchema = registry.rootSchema;

    // Wrap packSize in an object to match the schema structure
    const tempData = { packSize };
    const tempSchema = {
      type: 'object',
      properties: {
        packSize: packSizeSchema,
      },
    };

    // Validate using AJV
    const errors = validator.validateFormData(
      tempData,
      tempSchema,
      rootSchema,
    ).errors;

    // If no errors, accept the new value
    if (!errors || errors.length === 0) {
      return newValue;
    }

    return {
      ...newValue,
      packSize: inputValue.packSize, // Keep previous value if invalid
    };
  };

  const { fields } = registry;
  const { ObjectField } = fields;

  const isAddDisabled = !isPackSizeValid() || isPackSizeDuplicate();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          flexGrow: 1,
          border: 1,
          borderColor: 'grey.300',
          p: 1,
          borderRadius: 1,
        }}
      >
        <ObjectField
          {...props}
          formData={inputValue}
          onChange={newValue => {
            const validatedValue = enforceSchemaConstraints(newValue);
            setInputValue(validatedValue);
            onChange(validatedValue);
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
