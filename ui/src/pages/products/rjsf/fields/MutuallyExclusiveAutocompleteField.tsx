import React, { useState } from 'react';
import { FieldProps } from '@rjsf/core';
import { Grid, Box, Typography } from '@mui/material';
import AutoCompleteField from './AutoCompleteField.tsx';
import { ConceptMini } from '../../../../types/concept.ts';
import _ from 'lodash';
import { getFieldName, getParentPath } from '../helpers/helpers.ts';
import { getFieldErrors, getUniqueErrors } from '../helpers/errorUtils.ts';
import { ErrorDisplay } from '../components/ErrorDisplay.tsx';

const MutuallyExclusiveAutocompleteField = ({
  name,
  formData,
  uiSchema,
  errorSchema = {},
  registry,
  formContext,
  idSchema,
  rawErrors,
}: FieldProps) => {
  const {
    fieldAName = '',
    fieldBName = '',
    fieldAOptions,
    fieldBOptions,
  } = uiSchema['ui:options'] || {};

  const fieldName = getFieldName(idSchema);
  const parentPath = getParentPath(fieldName);
  const rootFormData = _.get(
    registry,
    'rootSchema.formData',
    formContext?.formData || formData || {},
  );

  // Get the current data at parentPath to preserve other fields
  const currentData = _.get(rootFormData, parentPath) || {};

  const initialFieldAValue = _.get(currentData, fieldAName) || null;
  const initialFieldBValue = _.get(currentData, fieldBName) || null;

  const [fieldAValue, setFieldAValue] = useState<ConceptMini | null>(
    initialFieldAValue,
  );
  const [fieldBValue, setFieldBValue] = useState<ConceptMini | null>(
    initialFieldBValue,
  );
  const [isFieldADisabled, setIsFieldADisabled] =
    useState(!!initialFieldBValue);
  const [isFieldBDisabled, setIsFieldBDisabled] =
    useState(!!initialFieldAValue);

  const handleFieldAChange = (newValue: ConceptMini | null) => {
    setFieldAValue(newValue);

    const newRootFormData = _.cloneDeep(rootFormData);
    let updatedData = { ...currentData };

    if (newValue) {
      // Set fieldA and remove fieldB
      updatedData[fieldAName] = newValue;
      updatedData = _.omit(updatedData, fieldBName);
      setFieldBValue(null);
      setIsFieldBDisabled(true);
    } else {
      // Remove fieldA and enable fieldB
      updatedData = _.omit(updatedData, fieldAName);
      setIsFieldBDisabled(false);
    }

    _.set(newRootFormData, parentPath, updatedData);

    console.log('Field A change payload:', {
      path: parentPath,
      data: updatedData,
    });
    formContext?.onChange(newRootFormData);
  };

  const handleFieldBChange = (newValue: ConceptMini | null) => {
    setFieldBValue(newValue);

    const newRootFormData = _.cloneDeep(rootFormData);
    let updatedData = { ...currentData };

    if (newValue) {
      // Set fieldB and remove fieldA
      updatedData[fieldBName] = newValue;
      updatedData = _.omit(updatedData, fieldAName);
      setFieldAValue(null);
      setIsFieldADisabled(true);
    } else {
      // Remove fieldB and enable fieldA
      updatedData = _.omit(updatedData, fieldBName);
      setIsFieldADisabled(false);
    }

    _.set(newRootFormData, parentPath, updatedData);
    formContext?.onChange(newRootFormData);
  };

  const fieldAErrors = getUniqueErrors(rawErrors, errorSchema);
  const fieldBErrors = getFieldErrors(
    formContext?.errorSchema || {},
    `${parentPath}.${fieldBName}`,
  );

  return (
    <Grid container spacing={2} alignItems="center">
      {/* Field A (e.g., containerType) */}
      <Grid item xs={5}>
        <Box>
          {!fieldAOptions?.skipTitle && (
            <Typography variant="h6" gutterBottom>
              {fieldAOptions?.title}
              {/*{required && <span style={{ color: 'red' }}>*</span>}*/}
            </Typography>
          )}
          <AutoCompleteField
            name={idSchema.$id}
            schema={{ title: fieldAOptions?.title }}
            uiSchema={{
              'ui:options': {
                ...fieldAOptions,
                disabled: isFieldADisabled,
              },
            }}
            formData={fieldAValue}
            onChange={handleFieldAChange}
            errorSchema={errorSchema}
          />
          <ErrorDisplay errors={fieldAErrors} />
        </Box>
      </Grid>

      {/* OR Label */}
      <Grid item xs={2}>
        <Typography
          variant="h6"
          align="center"
          color="textSecondary"
          style={{ fontWeight: 'bold' }}
        >
          OR
        </Typography>
      </Grid>

      {/* Field B (e.g., deviceType) */}
      <Grid item xs={5}>
        <Box>
          {!fieldBOptions?.skipTitle && (
            <Typography variant="h6" gutterBottom>
              {fieldBOptions?.title}
            </Typography>
          )}
          <AutoCompleteField
            name={idSchema.$id.replaceAll(`_${fieldAName}`, `_${fieldBName}`)}
            schema={{ title: fieldBOptions?.title }}
            uiSchema={{
              'ui:widget': 'hidden',
              'ui:options': {
                ...fieldBOptions,
                disabled: isFieldBDisabled,
              },
            }}
            formData={fieldBValue}
            onChange={handleFieldBChange}
          />
          <ErrorDisplay errors={fieldBErrors} />
        </Box>
      </Grid>
    </Grid>
  );
};

export default MutuallyExclusiveAutocompleteField;
