import React from 'react';
import { FieldProps } from '@rjsf/utils';
import { Grid, TextField } from '@mui/material';
import EclAutocomplete from '../components/EclAutocomplete.tsx';
import useTaskById from '../../../../hooks/useTaskById.tsx';
import _ from 'lodash';
import { getFieldErrors, getUniqueErrors } from '../helpers/errorUtils.ts';
import { ErrorDisplay } from '../components/ErrorDisplay.tsx';
import { getFieldName, getParentPath } from '../helpers/helpers.ts';

const UnitValueUnWrappedField = (props: FieldProps) => {
  const {
    formData, // unit field data
    uiSchema,
    onChange,
    idSchema,
    rawErrors = [],
    registry,
    formContext,
    errorSchema = {},
  } = props;

  const options = uiSchema['ui:options'] || {};
  const valueFieldName = options.pairWith || 'value';
  const ecl = options.ecl || '';
  const showDefaultOptions = options.showDefaultOptions || false;
  const task = useTaskById();

  const rootFormData = _.get(
    registry,
    'rootSchema.formData',
    formContext.formData || {},
  );
  const fieldName = getFieldName(idSchema); // e.g., "containedProducts_0_unit"
  const parentPath = getParentPath(fieldName); // e.g., "containedProducts_0"
  const valuePath = `${parentPath}.${valueFieldName}`; // e.g., "containedProducts_0_value"
  const valueData = _.get(rootFormData, valuePath, '');

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value === '' ? null : Number(e.target.value);
    const newFormData = _.cloneDeep(rootFormData);
    _.set(newFormData, valuePath, newValue);
    formContext.onChange(newFormData);
  };

  const handleUnitChange = (selectedUnit: any | null) => {
    // Update unit in form data
    onChange(selectedUnit || null);

    // Trigger full form revalidation by updating the entire form data
    const newFormData = _.cloneDeep(rootFormData);
    _.set(newFormData, `${parentPath}.unit`, selectedUnit || null);
    formContext.onChange(newFormData); // Revalidate the entire form
  };

  const unitErrors = getUniqueErrors(rawErrors, errorSchema);
  const valueErrors = getFieldErrors(formContext.errorSchema || {}, valuePath);
  const allErrors = [...unitErrors, ...valueErrors].filter(
    (v, i, a) => a.indexOf(v) === i,
  );
  return (
    <Grid container spacing={1} direction={'row'} alignItems="center">
      <Grid item xs={6}>
        <TextField
          label="Value"
          value={valueData ?? ''}
          onChange={handleValueChange}
          type="number"
          fullWidth
          variant="outlined"
          // error={valueErrors.length > 0}
        />
      </Grid>
      <Grid item xs={6}>
        {task && (
          <EclAutocomplete
            value={formData}
            title="Unit"
            onChange={handleUnitChange}
            ecl={ecl}
            branch={task.branchPath}
            showDefaultOptions={showDefaultOptions}
            isDisabled={false}
            errorMessage={unitErrors.length > 0 ? unitErrors.join(', ') : ''}
          />
        )}
      </Grid>
      <ErrorDisplay errors={allErrors} />
    </Grid>
  );
};

export default UnitValueUnWrappedField;
