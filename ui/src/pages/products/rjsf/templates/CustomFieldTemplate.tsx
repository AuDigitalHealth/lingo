import { FieldProps } from '@rjsf/core';
import { Box, Typography } from '@mui/material';
import React from 'react';

const CustomFieldTemplate = (props: FieldProps) => {
  const {
    classNames,
    label,
    required,
    rawErrors,
    description,
    children,
    uiSchema,
  } = props;

  // Check if the field should be hidden based on ui:widget: "hidden"
  const isHidden = uiSchema?.['ui:widget'] === 'hidden';

  // If hidden, return null to skip rendering entirely
  if (isHidden) {
    return null;
  }

  const hasError = !!rawErrors && rawErrors.length > 0;
  const skipTitle = uiSchema?.['ui:options']?.skipTitle || false;

  // Enhance children with error styling
  const enhancedChildren = React.cloneElement(children, {
    rawErrors,
    sx: {
      ...children.props.sx, // Preserve existing styles
      ...(hasError && {
        '& .MuiOutlinedInput-root': {
          borderColor: 'error.main',
          '&:hover fieldset': { borderColor: 'error' },
          '&.Mui-focused fieldset': { borderColor: 'error.main' },
        },
        '& .MuiAutocomplete-inputRoot': {
          borderColor: 'error.main',
        },
        '& fieldset': { borderWidth: '2px' },
      }),
    },
  });

  return (
    <Box className={classNames} sx={{ width: '100%' }}>
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
      {enhancedChildren}
    </Box>
  );
};

export default CustomFieldTemplate;
