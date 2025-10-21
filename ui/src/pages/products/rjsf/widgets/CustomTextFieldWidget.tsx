import React, { useState, useEffect } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { TextField, Box } from '@mui/material';
import { isEmptyObjectByValue } from '../../../../utils/helpers/conceptUtils.ts';
import { defaultsToNone, getFormDataById } from '../helpers/helpers.ts';
import { isEqual } from 'lodash';
import ChangeIndicator from '../components/ChangeIndicator.tsx';
import { compareByValue } from '../helpers/comparator.ts';

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
  formData,
  formContext,
}) => {
  const placeholder = options?.placeholder || 'Enter value';
  let isNumber = schema?.type === 'number' || schema?.type === 'integer';
  if (options.inputType && options.inputType === 'text') {
    isNumber = false;
  }

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

  const showDiff =
    formContext?.mode === 'update' &&
    !isEmptyObjectByValue(formContext?.snowStormFormData);

  const originalValue = getFormDataById(formContext?.snowStormFormData, id);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1, // spacing between TextField and icon
        width: '100%',
      }}
    >
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

      <ChangeIndicator
        value={defaultsToNone(value)}
        originalValue={defaultsToNone(originalValue)}
        comparator={compareByValue}
        alwaysShow={showDiff}
        id={id}
      />
    </Box>
  );
};

export default CustomTextFieldWidget;
