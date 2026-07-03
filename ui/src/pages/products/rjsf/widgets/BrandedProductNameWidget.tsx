import React, { useEffect, useRef, useState } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Box, FormHelperText, TextField } from '@mui/material';

export interface BrandedProductNamePrefill {
  status: 'suggested' | 'empty' | 'none';
  value?: string;
  index?: number;
}

/**
 * Whether the widget should seed itself with the ticket suggestion. The widget applies the
 * prefill from within the resolved form (not via a separate setFormData in the authoring
 * component), so it cannot be clobbered by, or race with, the product-load setFormData — it
 * simply fills the empty field once the field renders. It seeds only while the field is still
 * empty and the user has not taken over, so a suggestion survives a later load overwrite but a
 * user edit (including clearing the field) is never fought.
 */
export function shouldSeedBrandedProductName(args: {
  isTargetSection: boolean;
  prefillStatus: BrandedProductNamePrefill['status'];
  prefillValue: string | undefined;
  currentValue: string;
  userEdited: boolean;
}): boolean {
  return (
    args.isTargetSection &&
    args.prefillStatus === 'suggested' &&
    !!args.prefillValue &&
    !args.userEdited &&
    args.currentValue === ''
  );
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
  // Set once the user actually edits the field, so auto-seeding stops and we never fight an edit.
  // Deliberately NOT set on focus: merely focusing to review the prefilled value is not an edit,
  // and doing so would suppress the initial seed (if focused before the async suggestion arrives)
  // and the re-seed after a product-load blanks the field (IEDC-7474).
  const userEditedRef = useRef(false);

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

  // Reset the user-edited guard when a new clear/load cycle begins (prefill goes back to 'none').
  // MedicationAuthoring remounts the widget on Clear via a form key, which resets the ref for free;
  // DeviceAuthoring does not remount, so without this a single edit would permanently block seeding
  // for every subsequent Clear in the session. Keying off 'none' re-arms seeding for the next
  // suggestion, and the status only returns to 'none' on clear/load, never mid-edit.
  useEffect(() => {
    if (prefill.status === 'none') {
      userEditedRef.current = false;
    }
  }, [prefill.status]);

  // Seed the ticket suggestion into the empty field from within the resolved form. Because this
  // runs in the widget (not via a setFormData in MedicationAuthoring), it cannot be lost to the
  // prefill-vs-product-load race that previously left the field blank intermittently (IEDC-7474).
  useEffect(() => {
    if (
      shouldSeedBrandedProductName({
        isTargetSection,
        prefillStatus: prefill.status,
        prefillValue: prefill.value,
        currentValue,
        userEdited: userEditedRef.current,
      })
    ) {
      onChange(prefill.value);
    }
  }, [isTargetSection, prefill.status, prefill.value, currentValue, onChange]);

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
          userEditedRef.current = true;
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
