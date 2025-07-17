import React from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Box, TextField, MenuItem, Typography } from '@mui/material';
import { FormLabel } from '@mui/material';

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

  if (
    isOneOfSelector === undefined ||
    isOneOfSelector ||
    options?.enumOptions?.length < 1
  ) {
    return <Box sx={{ display: 'none' }} />;
  }
  const disableDropdownOption = uiSchema?.['ui:options']?.disableDropdown;
  let shouldDisableDropdown: boolean;

  if (
    disableDropdownOption &&
    typeof disableDropdownOption === 'object' &&
    '$eval' in disableDropdownOption
  ) {
    if (formContext?.evaluateExpression) {
      try {
        shouldDisableDropdown = formContext.evaluateExpression(
          disableDropdownOption.$eval,
          { formData: formContext?.formData },
        );
      } catch (error) {
        console.error('CustomSelectWidget - evaluateExpression failed:', {
          error,
          evalExpression: disableDropdownOption.$eval,
        });
        shouldDisableDropdown = false;
      }
    } else {
      console.warn(
        'CustomSelectWidget - evaluateExpression not found in formContext',
      );
      shouldDisableDropdown = false;
    }
  } else if (
    typeof disableDropdownOption === 'string' &&
    formContext?.[disableDropdownOption]
  ) {
    shouldDisableDropdown = formContext[disableDropdownOption]({
      formData: formContext?.formData,
    });
  } else if (typeof disableDropdownOption === 'function') {
    shouldDisableDropdown = disableDropdownOption({
      formData: formContext?.formData,
    });
  } else {
    shouldDisableDropdown = !!disableDropdownOption;
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
          disabled={shouldDisableDropdown}
          required={required}
          onChange={e => onChange(e.target.value || undefined)}
          error={needsAttention}
          helperText={needsAttention ? 'Please select a valid option' : ''}
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': {
              borderRadius: '1px',
              backgroundColor: shouldDisableDropdown
                ? 'rgba(0, 0, 0, 0.08)'
                : '#fff',
              '&:hover fieldset': {
                borderColor: shouldDisableDropdown
                  ? 'rgba(0, 0, 0, 0.08)'
                  : '#1976d2',
              },
              '&.Mui-focused fieldset': {
                borderColor: shouldDisableDropdown
                  ? 'rgba(0, 0, 0, 0.08)'
                  : '#1976d2',
                borderWidth: shouldDisableDropdown ? '1px' : '2px',
              },
              '&.Mui-disabled fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.08)',
              },
            },
            '& .MuiInputLabel-root': {
              color: shouldDisableDropdown ? 'rgba(0, 0, 0, 0.3)' : '#424242',
              fontWeight: 500,
              '&.Mui-focused': {
                color: shouldDisableDropdown ? 'rgba(0, 0, 0, 0.3)' : '#1976d2',
              },
              '&.Mui-disabled': {
                color: 'rgba(0, 0, 0, 0.3)',
              },
            },
            '& .MuiSelect-select': {
              padding: '12px 14px',
              fontSize: 'normal',
              color: shouldDisableDropdown ? 'rgba(0, 0, 0, 0.3)' : 'inherit',
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
