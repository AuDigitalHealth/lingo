import React, { useEffect, useState } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Box, FormHelperText, TextField } from '@mui/material';

export interface BrandedProductNamePrefill {
  status: 'suggested' | 'empty' | 'none';
  value?: string;
  index?: number;
}

const BrandedProductNameWidget: React.FC<WidgetProps> = ({
  id,
  value,
  onChange,
  onBlur,
  onFocus,
  rawErrors = [],
  label,
  required,
  disabled,
  readonly,
  options,
  formContext,
}) => {
  const placeholder =
    typeof options?.placeholder === 'string'
      ? options.placeholder
      : 'Enter value';

  const [inputValue, setInputValue] = useState<string>(
    value !== undefined && value !== null ? String(value) : '',
  );

  useEffect(() => {
    setInputValue(value !== undefined && value !== null ? String(value) : '');
  }, [value]);

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const val = event.target.value;
    onChange(val === '' ? options?.emptyValue : val);
    onBlur(id, val);
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    onFocus(id, event.target.value);
  };

  const hasError = rawErrors.length > 0;
  // rawErrors is string[] in @rjsf/utils
  const errorMessages = hasError ? rawErrors.join(', ') : '';

  // Resolve prefill state from formContext (null-safe)
  const prefill: BrandedProductNamePrefill =
    formContext?.brandedProductNamePrefill ?? { status: 'none' };

  const currentValue =
    value !== undefined && value !== null ? String(value) : '';

  // Parse the contained-product index from the RJSF widget id.
  // RJSF ids look like: root_containedProducts_0_productDetails_brandedProductName
  // Extract the integer that follows "containedProducts_".
  const widgetIndexMatch = id.match(/containedProducts_(\d+)/);
  const widgetIndex =
    widgetIndexMatch !== null ? parseInt(widgetIndexMatch[1], 10) : null;

  // Determine helper text content and color
  let helperTextContent: string | undefined;
  let helperColor: string | undefined;

  // Only show hints when we can confirm the widget is in the prefilled section.
  const isTargetSection =
    widgetIndex !== null && widgetIndex === (prefill.index ?? 0);

  if (hasError) {
    helperTextContent = errorMessages;
  } else if (
    isTargetSection &&
    prefill.status === 'suggested' &&
    prefill.value &&
    currentValue === prefill.value
  ) {
    helperTextContent = 'Prefilled from the ticket — please review.';
    helperColor = 'info.main';
  } else if (
    isTargetSection &&
    prefill.status === 'empty' &&
    currentValue.trim() === ''
  ) {
    helperTextContent = "Couldn't derive a name from the ticket — enter one.";
    helperColor = 'warning.main';
  }

  return (
    <Box
      data-testid={id}
      sx={{
        display: 'flex',
        flexDirection: 'column',
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
        type="text"
        value={inputValue}
        disabled={disabled || readonly}
        onChange={e => {
          const val = e.target.value;
          setInputValue(val);
          if (val === '') {
            onChange(options?.emptyValue ?? undefined);
          } else {
            onChange(val);
          }
        }}
        onBlur={handleBlur}
        onFocus={handleFocus}
        error={hasError}
      />
      {helperTextContent && (
        <FormHelperText
          error={hasError}
          sx={
            !hasError && helperColor
              ? { color: helperColor, mx: '14px' }
              : { mx: '14px' }
          }
        >
          {helperTextContent}
        </FormHelperText>
      )}
    </Box>
  );
};

export default BrandedProductNameWidget;
