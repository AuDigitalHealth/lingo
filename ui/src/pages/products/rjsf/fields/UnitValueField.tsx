import React from 'react';
import { FieldProps } from '@rjsf/utils';
import { Grid, TextField } from '@mui/material';
import EclAutocomplete from '../components/EclAutocomplete.tsx';
import useTaskById from '../../../../hooks/useTaskById.tsx';

import { ErrorDisplay } from '../components/ErrorDisplay.tsx';
import { getUniqueErrors } from '../helpers/errorUtils.ts';

const UnitValueField = ({
  idSchema,
  name,
  formData,
  onChange,
  uiSchema,
  rawErrors = [],
  errorSchema = {},
}: FieldProps) => {
  const { value, unit } = formData || { value: undefined, unit: undefined };
  const task = useTaskById();
  const unitOptions = uiSchema?.unit?.['ui:options'] || {};

  const handleUnitChange = (selectedUnit: any | null) => {
    if (!selectedUnit) {
      const updatedFormData = { ...formData };
      delete updatedFormData.unit;
      if (!updatedFormData.value) {
        onChange(undefined);
      }
      onChange(updatedFormData);
    } else {
      onChange({ ...formData, unit: selectedUnit });
    }
  };

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    if (inputValue === '') {
      const updatedFormData = { ...formData };
      delete updatedFormData.value;
      if (!updatedFormData.unit) {
        onChange(undefined);
      } else {
        onChange(updatedFormData);
      }
    } else {
      const numericValue = parseFloat(inputValue);
      if (!isNaN(numericValue)) {
        onChange({ ...formData, value: numericValue });
      }
    }
  };

  // Get unique errors without prefix for rawErrors
  const allErrors = getUniqueErrors(rawErrors, errorSchema);

  return (
      <span data-component-name="UnitValueField">
    <Grid container spacing={1} alignItems="center">
      <Grid item xs={6}>
        <TextField
          data-testid={idSchema.$id}
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
            name={idSchema.$id + '_unit'}
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
      </span>
  );
};

export default UnitValueField;

// import React from 'react';
// import { FieldProps } from '@rjsf/utils';
// import UnitInput from "./UnitInput.tsx";
//
// const UnitValueField: React.FC<FieldProps<any, any>> = (props) => {
//   const { formData, onChange, uiSchema } = props;
//   return (
//       <UnitInput
//           value={formData}
//           onChange={onChange}
//           options={uiSchema && uiSchema['ui:options']}
//           showValue
//       />
//   );
// };
//
// export default UnitValueField;
