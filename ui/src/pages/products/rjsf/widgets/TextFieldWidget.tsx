import React from 'react';
import { WidgetProps } from '@rjsf/utils';
import { TextField, Box } from '@mui/material';

const TextFieldWidget = ({
  id,
  value,
  required,
  onChange,
  onBlur,
  onFocus,
  rawErrors = [], // Receive rawErrors
  label,
  options,
}: WidgetProps) => {
  const placeholder = options?.placeholder || 'Enter text';

  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) => {
    onChange(value === '' ? options.emptyValue : value);
  };
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  const hasError = rawErrors && rawErrors.length > 0;
  const errorMessages = hasError
    ? rawErrors
        .map((err: any) => {
          return err?.message;
        })
        .join(', ')
    : '';

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        id={id}
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={(value as string) || ''}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        error={hasError}
        helperText={hasError ? errorMessages : null}
        label={label}
        required={required}
      />
    </Box>
  );
};

export default TextFieldWidget;
