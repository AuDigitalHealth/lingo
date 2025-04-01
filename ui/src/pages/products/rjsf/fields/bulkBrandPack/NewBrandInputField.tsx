import React, { useState, useEffect } from 'react';
import { FieldProps } from '@rjsf/utils';
import { Box, IconButton, Tooltip } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const NewBrandInputField: React.FC<FieldProps> = props => {
  const { formData, onChange, formContext, registry } = props;

  const [inputValue, setInputValue] = useState(
    formData || { brand: undefined, externalIdentifiers: [] },
  );

  useEffect(() => {
    setInputValue(formData || { brand: undefined, externalIdentifiers: [] });
  }, [formData]);

  const handleAdd = () => {
    if (inputValue.brand) {
      const currentFormData = { ...formContext.formData };

      const currentBrands = Array.isArray(currentFormData.brands)
        ? [...currentFormData.brands]
        : [];
      const newBrand = { ...inputValue };
      const updatedBrands = [...currentBrands, newBrand];
      const updatedFormData = {
        ...currentFormData,
        brands: updatedBrands,
        newBrandInput: { brand: undefined, externalIdentifiers: [] },
      };

      formContext.onChange(updatedFormData);
    }
  };

  // Check if the brand already exists in existingBrands or brands
  const isBrandDuplicate = () => {
    if (!inputValue.brand || !inputValue.brand.conceptId) return false;

    const allBrands = [
      ...(formContext.formData.existingBrands || []),
      ...(formContext.formData.brands || []),
    ];

    return allBrands.some(
      brand => brand?.brand?.conceptId === inputValue.brand.conceptId,
    );
  };

  const { fields } = registry;
  const { ObjectField } = fields;

  const isAddDisabled = !inputValue.brand || isBrandDuplicate();

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
            setInputValue(newValue);
            onChange(newValue);
          }}
        />
      </Box>
      <Tooltip title="Add Brand">
        <span>
          <IconButton
            onClick={handleAdd}
            disabled={isAddDisabled}
            color="primary"
            aria-label="Add Brand"
          >
            <AddCircleOutlineIcon />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};

export default NewBrandInputField;
