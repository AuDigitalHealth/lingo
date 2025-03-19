import { FieldProps } from '@rjsf/core';
import { Box, FormHelperText, Typography } from '@mui/material';
import React from 'react';

const CustomFieldTemplate = (props: FieldProps) => {
  const {
    id,
    classNames,
    label,
    required,
    rawErrors,
    description,
    children,
    schema,
    uiSchema,
    formContext,
  } = props;

  const errorMessage = rawErrors && rawErrors[0] ? rawErrors[0] : '';
  const hasError = !!rawErrors && rawErrors.length > 0;

  // Check if this field is already processed by ArrayFieldTemplate
  const skipTitle = uiSchema['ui:options']?.skipTitle;

  // Enhance children with error styling
  const enhancedChildren = React.cloneElement(children, {
    rawErrors,
    sx: {
      ...children.props.sx, // Preserve existing styles
      ...(hasError && {
        '& .MuiOutlinedInput-root': { // Target TextField or similar components
          borderColor: 'error.main',
          '&:hover fieldset': { borderColor: 'error' },
          '&.Mui-focused fieldset': { borderColor: 'error.main' },
        },
        '& .MuiAutocomplete-inputRoot': { // Target Autocomplete
          borderColor: 'error.main',
        },
        '& fieldset': { borderWidth: '2px' }, // Thicker border for emphasis
      }),
    },
  });

  return (
      <Box className={classNames} sx={{ width: '100%' }}>
        {/* Skip rendering title and description if already processed */}
        {!skipTitle && (
            <div>
              {label && (
                  <Typography variant="h6" gutterBottom>
                    {label}
                    {required && <span style={{ color: 'red' }}>*</span>}
                  </Typography>
              )}
              {description && (
                  <div className="field-description">{description}</div>
              )}
            </div>
        )}

        {/* Render enhanced children */}
        {enhancedChildren}

        {/* Render validation error */}
        {errorMessage && (
            <FormHelperText sx={{ mt: 0, color: 'error' }} error>
              {errorMessage}
            </FormHelperText>
        )}
      </Box>
  );
};

export default CustomFieldTemplate;