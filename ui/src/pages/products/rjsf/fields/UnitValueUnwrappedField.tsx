import React from 'react';
import { FieldProps } from '@rjsf/utils';
import { Grid, TextField } from '@mui/material';
import EclAutocomplete from '../components/EclAutocomplete.tsx';
import useTaskById from '../../../../hooks/useTaskById.tsx';
import _ from 'lodash';

const UnitValueRowField = (props: FieldProps) => {
  const {
    formData, // value field data
    uiSchema,
    onChange,
    idSchema,
    rawErrors = [],
    registry,
    formContext,
  } = props;

  const options = uiSchema['ui:options'] || {};
  const unitFieldName = options.unitField || 'unit';
  const ecl = options.ecl || '';
  const showDefaultOptions = options.showDefaultOptions || false;
  const task = useTaskById();

  // Access parent form data to get 'unit'
  const rootFormData = _.get(registry, 'rootSchema.formData', formContext.formData || {});
  const parentPath = idSchema.$id.split('_').slice(0, -1).join('_'); // e.g., "root_containedProducts_0"
  const unitPath = `${parentPath.split('_').slice(1).join('.')}.${unitFieldName}`;
  const unitData = _.get(rootFormData, unitPath);

  // Handle value change
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value === '' ? undefined : Number(e.target.value);
    onChange(newValue); // Updates only 'value'
  };

  // Handle unit change
  const handleUnitChange = (selectedUnit: any | null) => {
    const newFormData = _.cloneDeep(rootFormData);
    _.set(newFormData, unitPath, selectedUnit);
    formContext.onChange(newFormData); // Updates entire form data
  };

  return (
      <Grid container spacing={2} direction="row" alignItems="center">
        <Grid item xs={6}>
          <TextField
              value={formData ?? ''}
              onChange={handleValueChange}
              type="number"
              fullWidth
              variant="outlined"
              error={rawErrors.length > 0}
              helperText={rawErrors.length > 0 ? rawErrors.join(', ') : ''}
              inputProps={{ min: 0 }}
          />
        </Grid>
        <Grid item xs={6}>
          {task && (
              <EclAutocomplete
                  value={unitData}
                  onChange={handleUnitChange}
                  ecl={ecl}
                  branch={task.branchPath}
                  showDefaultOptions={showDefaultOptions}
                  isDisabled={false}
                  errorMessage={''} // Unit errors would need separate handling
              />
          )}
        </Grid>
      </Grid>
  );
};

export default UnitValueRowField;