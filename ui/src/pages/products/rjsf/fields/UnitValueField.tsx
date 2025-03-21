import React from 'react';
import { FieldProps } from '@rjsf/utils';
import { Grid, TextField } from '@mui/material';
import EclAutocomplete from '../components/EclAutocomplete.tsx';
import useTaskById from '../../../../hooks/useTaskById.tsx';

import { ErrorDisplay } from '../components/ErrorDisplay.tsx';
import { getUniqueErrors } from '../helpers/errorUtils.ts'; // Adjust path

const UnitValueField = ({
  formData,
  onChange,
  schema,
  uiSchema,
  rawErrors = [],
  errorSchema = {},
}: FieldProps) => {
  const { value, unit } = formData || { value: undefined, unit: undefined };
  const task = useTaskById();
  const title = uiSchema?.['ui:title'] || 'Unit and Value';
  const unitOptions = uiSchema?.unit?.['ui:options'] || {};

  const handleUnitChange = (selectedUnit: any | null) => {
    if (!selectedUnit) {
      const updatedFormData = { ...formData };
      delete updatedFormData.unit;
      if (!updatedFormData.unit) delete updatedFormData.value;
      onChange(updatedFormData);
    } else {
      onChange({ ...formData, unit: selectedUnit, value: value || 0 });
    }
  };

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseFloat(event.target.value);
    if (!isNaN(numericValue)) {
      onChange({ ...formData, value: numericValue });
    }
  };

  // Get unique errors without prefix for rawErrors
  const allErrors = getUniqueErrors(rawErrors, errorSchema);

  return (
    <Grid container spacing={1} alignItems="center">
      <Grid item xs={6}>
        <TextField
          label="Value"
          value={value ?? ''}
          onChange={handleValueChange}
          type="number"
          fullWidth
          variant="outlined"
        />
      </Grid>
      <Grid item xs={6}>
        {task && (
          <EclAutocomplete
            value={unit}
            onChange={handleUnitChange}
            ecl={unitOptions.ecl || ''}
            branch={task.branchPath}
            showDefaultOptions={unitOptions.showDefaultOptions || true}
            isDisabled={false}
            title="Unit"
            errorMessage={''}
          />
        )}
      </Grid>
      <ErrorDisplay errors={allErrors} />
    </Grid>
  );
};

export default UnitValueField;
