import React, { useState, useEffect, useCallback } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { TextField, Box } from '@mui/material';
import debounce from 'lodash/debounce';

const NumberTextFieldWidget = ({
  id,
  value,
  required,
  onChange,
  onBlur,
  onFocus,
  rawErrors = [],
  label,
  options,
  schema,
}: WidgetProps) => {
  const placeholder = options?.placeholder || 'Enter value';
  const isNumber = schema?.type === 'number' || schema?.type === 'integer';

  const [inputValue, setInputValue] = useState<string>(
    value !== undefined && value !== null ? String(value) : '',
  );

  useEffect(() => {
    setInputValue(value !== undefined && value !== null ? String(value) : '');
  }, [value]);

  const debouncedOnChange = useCallback(
    debounce((val: string) => {
      if (val === '') {
        onChange(options?.emptyValue);
      } else {
        onChange(isNumber ? Number(val) : val);
      }
    }, 200),
    [onChange, options, isNumber],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    setInputValue(val); // instant typing
    debouncedOnChange(val); // delayed RJSF update
  };

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) =>
      onBlur(id, event.target.value),
    [id, onBlur],
  );

  const handleFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) =>
      onFocus(id, event.target.value),
    [id, onFocus],
  );

  const hasError = rawErrors && rawErrors.length > 0;
  const errorMessages = hasError
    ? rawErrors.map((err: any) => err?.message).join(', ')
    : '';

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        id={id}
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        error={hasError}
        helperText={hasError ? errorMessages : null}
        label={label}
        required={required}
        type={isNumber ? 'number' : 'text'}
      />
    </Box>
  );
};

export default NumberTextFieldWidget;
