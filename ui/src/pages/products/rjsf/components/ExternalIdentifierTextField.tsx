// ExternalIdentifierTextField.tsx
import React from 'react';
import { TextField } from '@mui/material';

interface ExternalIdentifierTextFieldProps {
  schema: any;
  schemeName: string;
  formData: any[];
  schemeEntries?: any[];
  readOnly?: boolean;
  errorTooltip?: string;
  missingRequiredFieldError?: boolean;
  info?: string;
  onChange: (updated: any[]) => void;
  inputValue: string;
  setInputValue: (val: string) => void;
  handleTextFieldInputChange: () => void;
}

export const ExternalIdentifierTextField: React.FC<
  ExternalIdentifierTextFieldProps
> = ({
  schema,
  schemeName,
  formData,
  schemeEntries,
  readOnly = false,
  errorTooltip,
  missingRequiredFieldError,
  info,
  onChange,
  inputValue,
  setInputValue,
  handleTextFieldInputChange,
}) => {
  const isNumber = schema?.type === 'number';

  return (
    <TextField
      fullWidth
      type={isNumber ? 'number' : 'text'}
      disabled={readOnly}
      label={schema.title}
      value={inputValue ? inputValue : schemeEntries?.[0]?.value || ''}
      onChange={e => {
        const val = e.target.value;
        if (val === '') {
          onChange(
            (formData ?? []).filter(
              item => item.identifierScheme !== schemeName,
            ),
          );
        }
        setInputValue(val);
      }}
      onBlur={handleTextFieldInputChange}
      InputProps={{
        inputProps: {
          step: isNumber ? '0.01' : undefined,
        },
      }}
      error={errorTooltip || missingRequiredFieldError}
      helperText={
        errorTooltip ||
        (missingRequiredFieldError ? 'Field must be populated' : info)
      }
      sx={{
        '& .MuiFormHelperText-root': {
          m: 0,
          minHeight: '1em',
          color:
            errorTooltip || missingRequiredFieldError
              ? 'error.main'
              : 'text.secondary',
        },
      }}
    />
  );
};
