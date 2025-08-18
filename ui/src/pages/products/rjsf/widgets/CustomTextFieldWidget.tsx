import React, { useState, useEffect } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { TextField, Box } from '@mui/material';

const CustomTextFieldWidget: React.FC<WidgetProps> = ({
  id,
  value,
  onChange,
  onBlur,
  onFocus,
  rawErrors = [],
  label,
  required,
  options,
  schema,
}) => {
  const placeholder = options?.placeholder || 'Enter value';
  const isNumber = schema?.type === 'number' || schema?.type === 'integer';

  // Local state for fast typing
  const [inputValue, setInputValue] = useState<string>(
    value !== undefined && value !== null ? String(value) : '',
  );

  // Sync with external value changes
  useEffect(() => {
    setInputValue(value !== undefined && value !== null ? String(value) : '');
  }, [value]);

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const val = event.target.value;
    onChange(val === '' ? options?.emptyValue : isNumber ? Number(val) : val);
    onBlur(id, val);
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    onFocus(id, event.target.value);
  };

  const hasError = rawErrors && rawErrors.length > 0;
  const errorMessages = hasError
    ? rawErrors.map(err => err?.message).join(', ')
    : '';

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        id={id}
        fullWidth
        variant="outlined"
        label={label}
        required={required}
        placeholder={placeholder}
        type={isNumber ? 'number' : 'text'}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)} // local typing only
        onBlur={handleBlur} // form update
        onFocus={handleFocus}
        error={hasError}
        helperText={hasError ? errorMessages : null}
      />
    </Box>
  );
};

export default CustomTextFieldWidget;
