import React from 'react';
import { Grid, TextField, Typography } from '@mui/material';
import { FieldProps } from '@rjsf/utils';
import AutoCompleteField from './AutoCompleteField';

const UnitValueField = ({
  formData,
  onChange,
  schema,
  uiSchema,
}: FieldProps) => {
  const { value, unit } = formData || { value: undefined, unit: undefined };

  const handleUnitChange = (selectedUnit: any | null) => {
    if (!selectedUnit) {
      // Remove the 'unit' property from formData if selectedUnit is null
      const updatedFormData = { ...formData };
      delete updatedFormData.unit;

      // Remove the 'value' property if unit is not present
      if (!updatedFormData.unit) {
        delete updatedFormData.value;
      }

      onChange(updatedFormData);
    } else {
      // Update unit value using the AutoCompleteField's onChange handler
      onChange({ ...formData, unit: selectedUnit, value: value || 0 });
    }
  };

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseFloat(event.target.value);
    if (!isNaN(numericValue)) {
      onChange({ ...formData, value: numericValue });
    }
  };

  // Get title from uiSchema (with fallback if title is not provided)
  const title = uiSchema?.['ui:title'] || 'Unit and Value';

  // Get only the 'unit' specific options from the uiSchema
  const unitOptions = uiSchema?.unit?.['ui:options'] || {};

  return (
    <Grid container spacing={1}>
      {/* Value field (e.g., number input) */}
      <Grid item xs={6}>
        <TextField
          label="Value"
          value={value ?? ''}
          onChange={handleValueChange}
          type="number"
          fullWidth
        />
      </Grid>

      {/* Unit field with AutoCompleteField */}
      <Grid item xs={6}>
        <AutoCompleteField
          schema={schema} // Pass schema for AutoCompleteField
          formData={unit} // Pass the current unit value
          onChange={handleUnitChange} // Handle changes for unit
          uiSchema={{
            'ui:options': unitOptions, // Pass only the relevant 'unit' options
          }}
        />
      </Grid>
    </Grid>
  );
};

export default UnitValueField;
