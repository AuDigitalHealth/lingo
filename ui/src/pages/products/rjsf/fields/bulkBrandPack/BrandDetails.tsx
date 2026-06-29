import React, { useRef, useState } from 'react';
import {
  Box,
  FormHelperText,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { FieldProps } from '@rjsf/utils';
import AutoCompleteField from '../AutoCompleteField.tsx';
import ExternalIdentifier from './ExternalIdentifiers.tsx';
import { RjsfUtils } from '../../helpers/rjsfUtils.ts';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Compute the brand-substitution suggestion given the same inputs as handleBrandChange.
// Returns undefined when no reliable substitution can be derived.
function computeBrandSubstitution(
  sourceAmpPt: string | undefined,
  existingBrands: any[],
  newBrandTerm: string | undefined,
): string | undefined {
  const oldBrandTerm: string | undefined =
    existingBrands.length === 1
      ? existingBrands[0]?.brand?.pt?.term
      : undefined;
  if (
    sourceAmpPt &&
    oldBrandTerm &&
    newBrandTerm &&
    sourceAmpPt.includes(oldBrandTerm)
  ) {
    // Use split().join() for global replacement, consistent with replaceBrand in brandRenameHelper.
    return sourceAmpPt.split(oldBrandTerm).join(newBrandTerm);
  }
  return undefined;
}

interface BrandedProductNameFieldProps {
  formData: any;
  formContext: any;
  onChange: (updated: any) => void;
  lastAutoSubstitution: string | undefined;
}

const BrandedProductNameField: React.FC<BrandedProductNameFieldProps> = ({
  formData,
  formContext,
  onChange,
  lastAutoSubstitution,
}) => {
  const existingBrands: any[] = formContext?.formData?.existingBrands || [];
  const sourceAmpPt: string | undefined =
    formContext?.formData?.selectedProduct;
  const newBrandTerm: string | undefined = formData?.brand?.pt?.term;
  const currentValue: string = formData?.brandedProductName ?? '';

  // canSuggest: a brand is selected and we have the inputs to attempt a substitution
  const canSuggest =
    !!newBrandTerm && !!sourceAmpPt && existingBrands.length === 1;

  // Recompute the candidate substitution to know whether a "couldn't derive" warning applies.
  const suggestion = computeBrandSubstitution(
    sourceAmpPt,
    existingBrands,
    newBrandTerm,
  );

  let helperText: string | undefined;
  let helperColor: string | undefined;

  // Show the "prefilled" hint only when the current value is exactly the value
  // that handleBrandChange auto-filled (tracked via lastAutoSubstitution). This
  // prevents the hint from appearing when the author typed the same string
  // by coincidence, or when the recomputed suggestion matches a hand-typed value.
  if (
    lastAutoSubstitution !== undefined &&
    currentValue === lastAutoSubstitution
  ) {
    helperText = 'Prefilled from the brand substitution — please review.';
    helperColor = 'info.main';
  } else if (canSuggest && !suggestion && currentValue.trim() === '') {
    // Brand selected, substitution attempted but couldn't derive (token not found), field blank
    helperText = "Couldn't derive a name — enter one.";
    helperColor = 'warning.main';
  }

  return (
    <Box>
      <TextField
        fullWidth
        size="small"
        label="Branded product name"
        helperText="Used to name the new AMP. Edit if the suggestion is wrong; leave blank to derive from modelling."
        value={currentValue}
        onChange={e =>
          onChange({
            ...formData,
            brandedProductName: e.target.value,
          })
        }
      />
      {helperText && (
        <FormHelperText sx={{ color: helperColor, mx: '14px' }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};

interface BrandDetailsProps extends FieldProps {
  onDelete?: () => void;
  index?: number;
  onCopyNonDefiningProperties?: () => void;
}

const BrandDetails: React.FC<BrandDetailsProps> = props => {
  const {
    onChange,
    formContext,
    schema,
    uiSchema,
    registry,
    errorSchema,
    onDelete,
    formData = {},
    branch,
  } = props;

  const uiSchemaForNonDefiningProperties = RjsfUtils.getUiSchemaById(
    registry.formContext.uiSchema,
    'nonDefiningProperties',
  );
  // Extract options with defaults
  const nonDefiningPropertyOptions =
    uiSchemaForNonDefiningProperties?.['ui:options'] || {};
  const packSizeUiSchemaOptions = uiSchema?.['ui:options'] || {};

  const {
    binding = {},
    multiValuedSchemes = [],
    mandatorySchemes = [],
    propertyOrder = [],
    readOnlyProperties = [],
    hiddenProperties = [],
  } = nonDefiningPropertyOptions;

  const {
    readOnly = false,
    allowDelete = true,
    requireEditButton = false,
    ecl,
    createBrand,
    nondefiningPropertyTitle,
    allowCopy,
    allowNonDefiningPropertyEdit,
  } = packSizeUiSchemaOptions;

  const [editMode, setEditMode] = useState(!readOnly && !requireEditButton);
  const [duplicateError, setDuplicateError] = useState<string | undefined>(
    undefined,
  );
  // Tracks the last value that handleBrandChange auto-filled via substitution.
  // The hint in BrandedProductNameField compares against this to show provenance
  // only when the current value was actually written by the auto-fill, not typed.
  const substitutionAppliedRef = useRef<string | undefined>(undefined);

  // Ensure externalIdentifiers is always an array
  const nonDefiningProperties = Array.isArray(formData?.nonDefiningProperties)
    ? formData.nonDefiningProperties
    : [];

  const handleBrandChange = (newBrand: any) => {
    const existingBrands: any[] = formContext?.formData?.existingBrands || [];
    const isDuplicate =
      newBrand?.conceptId &&
      existingBrands.some(
        (eb: any) => eb?.brand?.conceptId === newBrand.conceptId,
      );
    setDuplicateError(isDuplicate ? 'Brand name already exists' : undefined);

    // Best-effort default: source AMP preferred term with the old brand term swapped for the new.
    // formContext.formData.selectedProduct holds the source AMP PT (set in BrandAuthoring.tsx).
    // Only suggest when there is exactly one existing brand — if there are zero or more than one
    // we cannot reliably identify which term to replace, so we leave the field as-is.
    const sourceAmpPt: string | undefined =
      formContext?.formData?.selectedProduct;
    const oldBrandTerm: string | undefined =
      existingBrands.length === 1
        ? existingBrands[0]?.brand?.pt?.term
        : undefined;
    const newBrandTerm: string | undefined = newBrand?.pt?.term;
    const alreadyHasValue: string | undefined = formData?.brandedProductName;
    let suggested: string | undefined = alreadyHasValue;
    if (
      !alreadyHasValue &&
      sourceAmpPt &&
      oldBrandTerm &&
      newBrandTerm &&
      sourceAmpPt.includes(oldBrandTerm)
    ) {
      // Use split().join() for global replacement, consistent with replaceBrand in
      // brandRenameHelper — replaces every occurrence rather than only the first.
      suggested = sourceAmpPt.split(oldBrandTerm).join(newBrandTerm);
    }

    // Record whether we just auto-filled a substitution so the hint can show honest
    // provenance. Clear the ref if the field already had a value (not auto-filled).
    if (!alreadyHasValue && suggested !== undefined && suggested !== '') {
      substitutionAppliedRef.current = suggested;
    } else {
      substitutionAppliedRef.current = undefined;
    }

    onChange({ ...formData, brand: newBrand, brandedProductName: suggested });
  };

  const handleNonDefiningPropertyChange = (updated: any[]) => {
    const current = {
      ...formData,
      nonDefiningProperties: Array.isArray(updated) ? updated : [],
    };
    onChange(current);
  };

  const handleAddNonDefiningProperty = (newIdentifier: any) => {
    if (newIdentifier) {
      const updatedIdentifiers = [...nonDefiningProperties, newIdentifier];
      handleNonDefiningPropertyChange(updatedIdentifiers);
    }
  };

  const handleDeleteNonDefiningProperty = (index: number) => {
    if (index >= 0 && index < nonDefiningProperties.length) {
      const updatedIdentifiers = nonDefiningProperties.filter(
        (_: any, i: number) => i !== index,
      );
      handleNonDefiningPropertyChange(updatedIdentifiers);
    }
  };

  const handleUpdateNonDefiningProperty = (
    index: number,
    updatedIdentifier: any,
  ) => {
    if (
      index >= 0 &&
      index < nonDefiningProperties.length &&
      updatedIdentifier
    ) {
      const updatedIdentifiers = [...nonDefiningProperties];
      updatedIdentifiers[index] = updatedIdentifier;
      handleNonDefiningPropertyChange(updatedIdentifiers);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Action Buttons */}
      <Box
        sx={{
          position: 'absolute',
          right: 0,
          top: 0,
          zIndex: 1,
          display: 'flex',
          gap: 1,
        }}
      >
        {allowCopy && props.onCopyNonDefiningProperties && (
          <Tooltip title="Replace input with copied Non-Defining Properties">
            <IconButton
              size="small"
              disabled={requireEditButton && !editMode}
              onClick={props.onCopyNonDefiningProperties}
              color="primary"
            >
              <Box display="flex" alignItems="center" gap={0.5}>
                <ContentCopyIcon fontSize="small" />
                <ArrowForwardIcon fontSize="small" />
              </Box>
            </IconButton>
          </Tooltip>
        )}
        {!readOnly && requireEditButton && (
          <Tooltip title={editMode ? 'Done' : 'Edit'}>
            <IconButton size="small" onClick={() => setEditMode(prev => !prev)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
        {allowDelete && onDelete && (
          <Tooltip title="Delete">
            <IconButton
              size="small"
              disabled={requireEditButton && !editMode}
              onClick={onDelete}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Content */}
      <Box
        display="flex"
        flexDirection="column"
        sx={{ width: '100%', paddingRight: allowDelete ? '80px' : '0px' }}
      >
        <Stack gap={2}>
          {/* Brand Selection */}
          <Box>
            {readOnly || (requireEditButton && !editMode) ? (
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {formData?.brand?.pt?.term || 'No brand selected'}
              </Typography>
            ) : (
              <AutoCompleteField
                {...props}
                id="package-new-brand"
                idSchema={{ $id: 'package-new-brand' }}
                errorMessage={duplicateError}
                formData={formData?.brand}
                onChange={handleBrandChange}
                schema={schema?.properties?.brand}
                uiSchema={{
                  ...(uiSchema?.brand || {}),
                  'ui:options': {
                    ...(uiSchema?.brand?.['ui:options'] || {}),
                    ecl: ecl,
                    showDefaultOptions: false,
                    label: 'Brand',
                    skipTitle: false,
                    createBrand: createBrand,
                  },
                }}
                registry={registry}
                formContext={formContext}
              />
            )}
            {!readOnly && (
              <Box sx={{ mt: 2 }}>
                <BrandedProductNameField
                  formData={formData}
                  formContext={formContext}
                  onChange={onChange}
                  lastAutoSubstitution={substitutionAppliedRef.current}
                />
              </Box>
            )}
          </Box>

          <Box>
            <ExternalIdentifier
              {...props}
              formData={nonDefiningProperties}
              onChange={handleNonDefiningPropertyChange}
              onAdd={handleAddNonDefiningProperty}
              onDelete={handleDeleteNonDefiningProperty}
              onUpdate={handleUpdateNonDefiningProperty}
              schema={schema?.properties?.nonDefiningProperties}
              uiSchema={{
                'ui:options': {
                  readOnly: allowNonDefiningPropertyEdit ? false : true, //change this to a new flag
                  mandatorySchemes,
                  multiValuedSchemes,
                  readOnlyProperties,
                  hiddenProperties,
                  binding,
                  label: nondefiningPropertyTitle,
                  skipTitle: false,
                  propertyOrder,
                },
              }}
              errorSchema={formContext.errorSchema}
              rawErrors={
                readOnly
                  ? []
                  : formContext.formErrors
                    ? formContext.formErrors.map(e => e.message)
                    : []
              }
              registry={registry}
              formContext={formContext}
              branch={branch}
            />
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default BrandDetails;
