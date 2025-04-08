import React from 'react';
import { FieldProps } from '@rjsf/utils';
import { Grid, TextField, Typography, Box } from '@mui/material';
import _ from 'lodash';
import {
  getFieldName,
  getParentPath,
  getUiSchemaPath,
} from '../helpers/helpers.ts';
import EclAutocomplete from '../components/EclAutocomplete.tsx';
import useTaskById from '../../../../hooks/useTaskById.tsx';
import { Task } from '../../../../types/task.ts';

import { ErrorDisplay } from '../components/ErrorDisplay.tsx';
import {
  extractAllErrorMessages,
  getFieldErrors,
} from '../helpers/errorUtils.ts';

const CompactQuantityField = ({
  name,
  formData,
  schema,
  uiSchema,
  idSchema,
  required,
  formContext,
  rawErrors = [],
  errorSchema = {},
  registry,
}: FieldProps) => {
  const task = useTaskById();
  const mainValue = _.get(formData, 'value', undefined);
  const mainUnit = _.get(formData, 'unit', undefined);
  const title = _.get(uiSchema, 'ui:title', 'Quantity');
  const unitOptions = _.get(uiSchema, 'unit.ui:options', {});
  const isNumerator = _.get(uiSchema, 'ui:options.isNumerator', false);
  const pairWith = _.get(uiSchema, 'ui:options.pairWith', null);
  const rootFormData = _.get(registry, 'formContext.formData', {});
  const fieldName = getFieldName(idSchema);
  const pairedField = pairWith
    ? `${getParentPath(fieldName)}.${pairWith}`
    : undefined;
  const pairedFormData =
    pairedField && isNumerator ? _.get(rootFormData, pairedField, {}) : {};
  const pairedValue = _.get(pairedFormData, 'value', '');
  const pairedUnit = _.get(pairedFormData, 'unit', undefined);
  const pairedUiSchemaPath = `${getUiSchemaPath(getParentPath(fieldName))}.${pairWith}`;
  const pairedUnitUiOptions = _.get(
    formContext.uiSchema,
    `${pairedUiSchemaPath}.unit.ui:options`,
    {},
  );
  const pairedSchemaPath = pairedField
    ?.split('.')
    .map(part => part.replace(/\[\d+\]/, '.items'))
    .join('.');
  const pairedUnitSchema = _.get(
    registry.rootSchema,
    `${pairedSchemaPath}.properties.unit`,
    {},
  );

  const numeratorErrors = extractAllErrorMessages(errorSchema);
  const denominatorErrors = pairedField
    ? getFieldErrors(formContext.errorSchema || {}, pairedField)
    : [];

  // Consolidate errors with prefixes
  const allErrorsSet = new Set<string>(rawErrors.map(error => `${error}`));
  numeratorErrors
    .map(error => `${error}`)
    .forEach(error => allErrorsSet.add(error));
  denominatorErrors
    .map(error => `${error}`)
    .forEach(error => allErrorsSet.add(error));
  const allErrors = Array.from(allErrorsSet);

  const handleValueChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    isPair = false,
  ) => {
    const inputValue = event.target.value;
    const targetField = isPair ? pairedField : fieldName;
    const targetData = isPair ? pairedFormData : formData;
    const newFormData = _.cloneDeep(rootFormData);

    if (inputValue === '') {
      let updatedFormData = { ...targetData };
      delete updatedFormData.value;
      if (!updatedFormData.unit) {
        updatedFormData = undefined;
      }
      _.set(newFormData, targetField, updatedFormData);
      formContext.onChange(newFormData);

      return;
    }

    const numericValue = parseFloat(inputValue);
    if (isNaN(numericValue)) return;
    const updatedFormData = { ...targetData, value: numericValue };
    _.set(newFormData, targetField, updatedFormData);
    formContext.onChange(newFormData);
  };

  const handleUnitChange = (selectedUnit: any | null, isPair = false) => {
    const targetField = isPair ? pairedField : fieldName;
    const targetData = isPair ? pairedFormData : formData;
    const newFormData = _.cloneDeep(rootFormData);

    if (!selectedUnit) {
      let updatedFormData = { ...targetData };
      delete updatedFormData.unit;
      if (!updatedFormData.value) {
        updatedFormData = undefined;
      }
      _.set(newFormData, targetField, updatedFormData);
    } else {
      const updatedFormData = {
        ...targetData,
        unit: selectedUnit,
      };
      _.set(newFormData, targetField, updatedFormData);
    }
    formContext.onChange(newFormData);
  };

  const renderQuantityField = ({
    label,
    value,
    unit,
    onValueChange,
    onUnitChange,

    uiOptions,
    errors,
    task,
  }: {
    label: string;
    value: any;
    unit: any;
    onValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUnitChange: (val: any) => void;
    unitSchema: any;
    uiOptions: any;
    idPrefix: string;
    required: boolean;
    errors: string[];
    task: Task;
  }) => (
    <Grid container spacing={1} alignItems="center">
      <Grid item xs={2}>
        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
          {label}
        </Typography>
      </Grid>
      <Grid item xs={5}>
        <TextField
          label="Value"
          value={value ?? ''}
          onChange={onValueChange}
          type="number"
          fullWidth
          variant="outlined"
        />
      </Grid>
      <Grid item xs={5} sx={{ mt: -0.5 }}>
        {task && (
          <EclAutocomplete
            idSchema={idSchema}
            name={name}
            value={unit}
            onChange={onUnitChange}
            ecl={uiOptions.ecl || ''}
            branch={task.branchPath}
            showDefaultOptions={uiOptions.showDefaultOptions || true}
            isDisabled={false}
            title="Unit"
            errorMessage={errors.length > 0 ? errors.join(', ') : ''}
            sx={{ mb: 0, mt: 0.5 }}
          />
        )}
      </Grid>
    </Grid>
  );

  if (!isNumerator && pairWith)
    return <>{allErrors && <ErrorDisplay errors={allErrors} />}</>;

  return (
    <Box sx={{ mb: '-35px' }}>
      <Typography sx={{ mb: 0.5 }}>{title}</Typography>
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'grey.400',
          borderRadius: 1,
          p: 2,
        }}
      >
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={12}>
            {renderQuantityField({
              label: 'Numerator',
              value: mainValue,
              unit: mainUnit,
              onValueChange: e => handleValueChange(e, false),
              onUnitChange: val => handleUnitChange(val, false),
              unitSchema: _.get(schema, 'properties.unit', {}),
              uiOptions: unitOptions,
              idPrefix: idSchema.$id,
              required,
              errors: numeratorErrors,
              task,
            })}
          </Grid>
          {pairWith && (
            <Grid item xs={12}>
              {renderQuantityField({
                label: 'Denominator',
                value: pairedValue,
                unit: pairedUnit,
                onValueChange: e => handleValueChange(e, true),
                onUnitChange: val => handleUnitChange(val, true),
                unitSchema: pairedUnitSchema,
                uiOptions: pairedUnitUiOptions,
                idPrefix: `${idSchema.$id}-${pairWith}`,
                required,
                errors: denominatorErrors,
                task,
              })}
            </Grid>
          )}
        </Grid>
      </Box>
      {allErrors && <ErrorDisplay errors={allErrors} />}
    </Box>
  );
};

export default CompactQuantityField;
