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

  // Define keywords to skip
  // const skippedErrorKeywords = ['discriminator', 'additionalProperties', 'oneOf', 'anyOf', 'allOf'];
   const skippedErrorKeywords = ['unlnown'];

  // Filter rawErrors to exclude skipped keywords
  const filteredErrors = (rawErrors || []).filter(
      (error: string) => !skippedErrorKeywords.some(keyword => error.toLowerCase().includes(keyword.toLowerCase()))
  );

  const hasError = !!filteredErrors && filteredErrors.length > 0;
  if (hasError) {
    console.log(`CustomFieldTemplate ${props.id}: rawErrors`, rawErrors, 'filteredErrors', filteredErrors);
  }

  const skipTitle =true;

  // Enhance children with error styling
  const enhancedChildren = React.cloneElement(children, {
    rawErrors: filteredErrors, // Pass filtered errors to children
    sx: {
      ...children.props.sx, // Preserve existing styles
      ...(hasError && {
        '& .MuiOutlinedInput-root': {
          borderColor: 'error.main',
          '&:hover fieldset': { borderColor: 'error.main' },
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
      <Box className={classNames} sx={{ width: '100%', mb: 2 }}>
        {!skipTitle && (
            <div>
              {label && (
                  <Typography variant="h6" gutterBottom>
                    {label}
                    {/*{required && <span style={{ color: 'red' }}>*</span>}*/}
                  </Typography>
              )}
              {description && (
                  <div className="field-description">{description}</div>
              )}
            </div>
        )}
        {enhancedChildren}
        {hasError && (
            <Box sx={{ mt: 1 }}>
              {filteredErrors.map((error: string, index: number) => (
                  <Typography
                      key={index}
                      color="error.main"
                      variant="caption"
                      component="div"
                  >
                    {error}
                  </Typography>
              ))}
            </Box>
        )}
      </Box>
  );
};

export default CustomFieldTemplate;