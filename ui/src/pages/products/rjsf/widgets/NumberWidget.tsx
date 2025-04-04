import * as React from 'react';
import { RJSFSchema, WidgetProps } from '@rjsf/utils';
import { TextField } from '@mui/material';

function NumberWidget<T = any, F extends RJSFSchema = RJSFSchema>({
  id,
  placeholder,
  required,
  readonly,
  disabled,
  label,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  autofocus,
  options,

  uiSchema,
  rawErrors,
  registry,
  hideError,
}: WidgetProps<T, F>) {
  const { templates } = registry;

  const handleChange = React.useCallback(
    (nextValue: string) => onChange(nextValue === '' ? '' : nextValue),
    [onChange],
  );
  const handleBlur = React.useCallback(
    ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
      onBlur(id, value),
    [onBlur, id],
  );
  const handleFocus = React.useCallback(
    ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
      onFocus(id, value),
    [onFocus, id],
  );

  return (
    <TextField
      key={id}
      id={id}
      label={label}
      name={name}
      placeholder={placeholder}
      value={value || value === 0 ? value as unknown : ''}
      required={required}
      disabled={disabled}
      readOnly={readonly}
      autoFocus={autofocus}
      type="number"
      // list={schema.examples ? `${id}-list` : undefined}
      {...options}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      error={!!rawErrors?.length && !hideError}
      helperText={
        !!rawErrors?.length && !hideError ? rawErrors.join(', ') : undefined
      }
      fullWidth
    />
  );
}
export default NumberWidget;
