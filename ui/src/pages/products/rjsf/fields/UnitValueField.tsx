import React from 'react';
import { Grid, TextField } from '@mui/material';
import { FieldProps } from '@rjsf/utils';
import AutoCompleteField from './AutoCompleteField';
import EclAutocomplete from '../components/EclAutocomplete.tsx';
import useTaskById from '../../../../hooks/useTaskById.tsx';

const UnitValueField = ({
  formData,
  onChange,
  schema,
  uiSchema,
  rawErrors = [],
}: FieldProps) => {
  const { value, unit } = formData || { value: undefined, unit: undefined };
  const task = useTaskById();
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
    <Grid container spacing={1} alignItems="center">
      {/* Value field (e.g., number input) */}
      <Grid item xs={6}>
        <TextField
          label="Value"
          value={value ?? ''}
          onChange={handleValueChange}
          type="number"
          fullWidth
          variant="outlined"
          // error={rawErrors.length > 0}
        />
      </Grid>

      <Grid item xs={6} sx={{ mt: 0 }}>
        {task && (
          <EclAutocomplete
            value={unit}
            onChange={handleUnitChange}
            ecl={unitOptions.ecl || ''}
            branch={task.branchPath}
            showDefaultOptions={unitOptions.showDefaultOptions || true}
            isDisabled={false}
            title="Unit"
            errorMessage={rawErrors.length > 0 ? rawErrors.join(', ') : ''}
          />
        )}
      </Grid>
    </Grid>
  );
};

export default UnitValueField;
