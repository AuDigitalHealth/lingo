import React, { useState } from 'react';
import { FieldProps } from '@rjsf/core';

import { Grid, Box, Typography } from '@mui/material';
import AutoCompleteField from './fields/AutoCompleteField.tsx';

const MutuallyExclusiveAutocompleteField = ({
  formData,
  uiSchema,
  onChange,
}: FieldProps) => {
  const { fieldAOptions, fieldBOptions, fieldAName, fieldBName } =
    uiSchema['ui:options'] || {};

  // Track the values of Field A and Field B
  const [fieldAValue, setFieldAValue] = useState(formData?.[fieldAName]);
  const [fieldBValue, setFieldBValue] = useState(formData?.[fieldBName]);

  const [isFieldADisabled, setIsFieldADisabled] = useState(false);
  const [isFieldBDisabled, setIsFieldBDisabled] = useState(false);

  // Handle Field A selection
  const handleFieldAChange = (newValue: any) => {
    setFieldAValue(newValue);
    if (newValue) {
      setFieldBValue(null); // Clear Field B value
      setIsFieldBDisabled(true); // Disable Field B
      onChange({
        ...formData,
        [fieldAName]: newValue,
        [fieldBName]: null,
      });
    } else {
      setIsFieldBDisabled(false); // Enable Field B
      onChange({
        ...formData,
        [fieldAName]: null,
      });
    }
  };

  // Handle Field B selection
  const handleFieldBChange = (newValue: any) => {
    setFieldBValue(newValue);
    if (newValue) {
      setFieldAValue(null); // Clear Field A value
      setIsFieldADisabled(true); // Disable Field A
      onChange({
        ...formData,
        [fieldBName]: newValue,
        [fieldAName]: null,
      });
    } else {
      setIsFieldADisabled(false); // Enable Field A
      onChange({
        ...formData,
        [fieldBName]: null,
      });
    }
  };

  return (
    <Grid container spacing={2} alignItems="center">
      {/* Field A */}
      <Grid item xs={5}>
        <Box>
          <AutoCompleteField
            schema={{ title: fieldAOptions?.title }}
            uiSchema={{
              'ui:options': {
                ...fieldAOptions,
                disabled: isFieldADisabled, // Make Field A non-clickable
              },
            }}
            formData={fieldAValue}
            onChange={handleFieldAChange}
          />
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

      {/* Field B */}
      <Grid item xs={5}>
        <Box>
          <AutoCompleteField
            schema={{ title: fieldBOptions?.title }}
            uiSchema={{
              'ui:options': {
                ...fieldBOptions,
                disabled: isFieldBDisabled, // Make Field B non-clickable
              },
            }}
            formData={fieldBValue}
            onChange={handleFieldBChange}
          />
        </Box>
      </Grid>
    </Grid>
  );
};

export default MutuallyExclusiveAutocompleteField;
