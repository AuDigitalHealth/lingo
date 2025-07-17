import React from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Box, TextField, MenuItem, Typography } from '@mui/material';

const CustomSelectWidget: React.FC<WidgetProps> = props => {
  const {
    schema,
    id,
    options,
    value,
    onChange,
    disabled,
    required,
    uiSchema,
    errorSchema,
    formContext,
  } = props;

  // Detect oneOf selector
  const isOneOfSelector =
    id.includes('oneof_select') ||
    id.includes('__rjsf_oneOf_select') ||
    id.includes('oneOf_select') ||
    id.includes('root_oneOf') ||
    id.endsWith('__rjsf_oneOf') ||
    schema.title === 'Options' ||
    (schema.enum &&
      options?.enumOptions?.length > 0 &&
      options.enumOptions.some(
        (opt: any) =>
          opt.label?.includes('Option') ||
          opt.value?.toString().startsWith('Option') ||
          opt.label?.includes('oneOf'),
      ));

  // Determine if dropdown should be hidden

  const variantValue = value || formContext?.formData?.variant || '';
  const displayValue =
    options.enumOptions?.find((opt: any) => opt.value === variantValue)
      ?.label || variantValue;

  if (
    isOneOfSelector === undefined ||
    isOneOfSelector ||
    options?.enumOptions?.length < 1
  ) {
    return <Box sx={{ display: 'none' }} />;
  }
  const hideDropdownOption = uiSchema?.['ui:options']?.hideDropdown;
  let shouldHideDropdown: boolean;

  if (
    hideDropdownOption &&
    typeof hideDropdownOption === 'object' &&
    '$eval' in hideDropdownOption
  ) {
    if (formContext?.evaluateExpression) {
      try {
        shouldHideDropdown = formContext.evaluateExpression(
          hideDropdownOption.$eval,
          { formData: formContext?.formData },
        );
      } catch (error) {
        console.error('CustomSelectWidget - evaluateExpression failed:', {
          error,
          evalExpression: hideDropdownOption.$eval,
        });
        shouldHideDropdown = false;
      }
    } else {
      console.warn(
        'CustomSelectWidget - evaluateExpression not found in formContext',
      );
      shouldHideDropdown = false;
    }
  } else if (
    typeof hideDropdownOption === 'string' &&
    formContext?.[hideDropdownOption]
  ) {
    shouldHideDropdown = formContext[hideDropdownOption]({
      formData: formContext?.formData,
    });
  } else if (typeof hideDropdownOption === 'function') {
    shouldHideDropdown = hideDropdownOption({
      formData: formContext?.formData,
    });
  } else {
    shouldHideDropdown = !!hideDropdownOption;
  }

  if (shouldHideDropdown) {
    return (
      <Typography
        sx={{
          padding: '12px 14px',
          fontSize: 'medium',
          color: '#424242',
          fontWeight: 500,
          backgroundColor: '#fff',
          border: '1px solid rgba(0, 0, 0, 0.23)',
          borderRadius: '1px',
          minHeight: '56px', // Match TextField height
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {displayValue || 'No variant selected'}
      </Typography>
    );
  }

  const errorMessage = errorSchema?.__errors?.[0] || '';
  const needsAttention = !!errorMessage;

  return (
    <Box display="flex" alignItems="center" gap={1} sx={{ width: '100%' }}>
      <Box flex={50} sx={{ position: 'relative' }}>
        <TextField
          select
          id={id}
          value={value || ''}
          label={uiSchema?.['ui:title'] || schema.title || 'Select'}
          disabled={disabled}
          required={required}
          onChange={e => onChange(e.target.value || undefined)}
          error={needsAttention}
          helperText={needsAttention ? 'Please select a valid option' : ''}
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': {
              borderRadius: '1px',
              backgroundColor: '#fff',
              '&:hover fieldset': {
                borderColor: '#1976d2',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#1976d2',
                borderWidth: '2px',
              },
            },
            '& .MuiInputLabel-root': {
              color: '#424242',
              fontWeight: 500,
              '&.Mui-focused': {
                color: '#1976d2',
              },
            },
            '& .MuiSelect-select': {
              padding: '12px 14px',
              fontSize: 'medium',
            },
            '& .MuiFormHelperText-root': {
              m: 0,
              minHeight: '1em',
              color: needsAttention ? 'error.main' : 'text.secondary',
            },
          }}
          SelectProps={{
            MenuProps: {
              PaperProps: {
                sx: {
                  borderRadius: '1px',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                  maxHeight: '300px',
                },
              },
            },
          }}
        >
          {options.enumOptions?.map((option: any) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </Box>
  );
};

export default CustomSelectWidget;
