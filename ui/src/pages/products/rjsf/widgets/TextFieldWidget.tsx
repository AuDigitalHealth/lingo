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
  const placeholder =
    (options?.placeholder as string | undefined) || 'Enter text';

  const errors = rawErrors as string[] | undefined;

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        id={id}
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={(value as string) || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        error={errors?.length > 0}
        helperText={errors && errors.length > 0 ? errors[0] : ''}
        label={label}
        required={required}
      />
    </Box>
  );
};

export default TextFieldWidget;
