import React from 'react';
import { Autocomplete, TextField, Chip } from '@mui/material';
import { WidgetProps } from '@rjsf/utils';

const MuiAutocompleteTagsWidget = (props: WidgetProps) => {
  const {
    id,
    value,
    label,
    onChange,
    onBlur,
    onFocus,
    options, // Options from schema.enum or ui:options.autocompleteOptions
    rawErrors = [],
    required,
    disabled,
    readonly,
    placeholder,
  } = props;

  // Ensure value is an array, even if it's null or undefined
  const currentValue = Array.isArray(value) ? value : [];

  const handleBlur = (event: React.FocusEvent<any>) =>
    onBlur(id, event.target.value);
  const handleFocus = (event: React.FocusEvent<any>) =>
    onFocus(id, event.target.value);

  return (
    <Autocomplete
      multiple
      id={id}
      options={options?.enumOptions?.map(option => option.value) || []} // Get options from schema.enum or ui:options
      value={currentValue}
      defaultValue={currentValue} // Set default value for initial render
      freeSolo
      onChange={(_, newValue) => onChange(newValue)}
      onBlur={handleBlur}
      onFocus={handleFocus}
      disabled={disabled}
      readOnly={readonly}
      renderTags={(value: readonly string[], getTagProps) =>
        value.map((option: string, index: number) => (
          <Chip variant="outlined" label={option} {...getTagProps({ index })} />
        ))
      }
      renderInput={params => (
        <TextField
          {...params}
          variant="filled"
          label={label || placeholder}
          placeholder={placeholder || 'Favorites'}
          required={required}
          error={rawErrors && rawErrors.length > 0}
          helperText={rawErrors?.join(', ')}
        />
      )}
    />
  );
};

export default MuiAutocompleteTagsWidget;
