import React, { useState } from 'react';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { FieldProps } from '@rjsf/utils';
import AutoCompleteField from '../AutoCompleteField.tsx';
import ExternalIdentifier from './ExternalIdentifiers.tsx';

interface BrandDetailsProps extends FieldProps {
  onDelete?: () => void;
  index?: number;
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

  // Extract options with defaults
  const options = uiSchema?.['ui:options'] || {};
  const {
    readOnly = false,
    allowDelete = true,
    requireEditButton = false,
    mandatorySchemes = [],
    multiValuedSchemes = [],
  } = options;

  const [editMode, setEditMode] = useState(!readOnly && !requireEditButton);

  // Ensure externalIdentifiers is always an array
  const nonDefiningProperties = Array.isArray(formData?.nonDefiningProperties)
    ? formData.nonDefiningProperties
    : [];

  const handleBrandChange = (newBrand: any) => {
    const updated = {
      ...formData,
      brand: newBrand,
    };
    onChange(updated);
  };

  const handleExternalIdentifiersChange = (updated: any[]) => {
    const current = {
      ...formData,
      nonDefiningProperties: Array.isArray(updated) ? updated : [],
    };
    onChange(current);
  };

  const handleAddExternalIdentifier = (newIdentifier: any) => {
    if (newIdentifier) {
      const updatedIdentifiers = [...nonDefiningProperties, newIdentifier];
      handleExternalIdentifiersChange(updatedIdentifiers);
    }
  };

  const handleDeleteExternalIdentifier = (index: number) => {
    if (index >= 0 && index < nonDefiningProperties.length) {
      const updatedIdentifiers = nonDefiningProperties.filter(
        (_: any, i: number) => i !== index,
      );
      handleExternalIdentifiersChange(updatedIdentifiers);
    }
  };

  const handleUpdateExternalIdentifier = (
    index: number,
    updatedIdentifier: any,
  ) => {
    if (index >= 0 && index < nonDefiningProperties.length && updatedIdentifier) {
      const updatedIdentifiers = [...nonDefiningProperties];
      updatedIdentifiers[index] = updatedIdentifier;
      handleExternalIdentifiersChange(updatedIdentifiers);
    }
  };

  const isValidBrand =
    formData?.brand && (formData.brand.conceptId || formData.brand.pt?.term);

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
        {!readOnly && requireEditButton && (
          <Tooltip title={editMode ? 'Done' : 'Edit'}>
            <IconButton size="small" onClick={() => setEditMode(prev => !prev)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
        {!readOnly && allowDelete && onDelete && (
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
                formData={formData?.brand}
                onChange={handleBrandChange}
                schema={schema?.properties?.brand}
                uiSchema={{
                  ...(uiSchema?.brand || {}),
                  'ui:options': {
                    ...(uiSchema?.brand?.['ui:options'] || {}),
                    ecl: '<774167006',
                    showDefaultOptions: false,
                    label: 'Brand',
                    skipTitle: false,
                  },
                }}
                registry={registry}
                formContext={formContext}
              />
            )}
          </Box>

          {/* External Identifiers */}
          <Box>
            <ExternalIdentifier
              {...props}
              formData={nonDefiningProperties}
              onChange={handleExternalIdentifiersChange}
              onAdd={handleAddExternalIdentifier}
              onDelete={handleDeleteExternalIdentifier}
              onUpdate={handleUpdateExternalIdentifier}
              schema={schema?.properties?.nonDefiningProperties}
              uiSchema={{
                'ui:options': {
                  readOnly: readOnly || (requireEditButton && !editMode),
                  mandatorySchemes,
                  multiValuedSchemes,
                  label: 'External Identifiers',
                  skipTitle: false,
                },
              }}
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
