import React from 'react';
import { WidgetProps } from '@rjsf/core';
import { TextField, Box } from '@mui/material';

const TextFieldWidget = ({
  id,
  value,
  required,
  onChange,
  rawErrors = [],
  label,
  options,
}: WidgetProps) => {
  const placeholder = options?.placeholder || 'Enter text';

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        id={id}
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={value || ''} // Controlled component
        onChange={e => onChange(e.target.value)} // Pass the updated value
        error={rawErrors.length > 0}
        helperText={rawErrors.length > 0 ? rawErrors[0] : ''}
        label={label}
        required={required}
      />
    </Box>
  );
};

export default TextFieldWidget;
