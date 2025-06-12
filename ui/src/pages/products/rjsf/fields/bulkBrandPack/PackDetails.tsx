import React, { useEffect, useState } from 'react';
import { Box, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { FieldProps } from '@rjsf/utils';
import ExternalIdentifiers from './ExternalIdentifiers.tsx';
import {
  sortExternalIdentifiers, sortNonDefiningProperties
} from '../../../../../utils/helpers/tickets/additionalFieldsUtils.ts';

interface PackDetailsProps extends FieldProps {
  onDelete?: () => void;
  unitOfMeasure?: any;
  index?: number;
}

const PackDetails: React.FC<PackDetailsProps> = props => {
  const {
    onChange,
    formContext,
    schema,
    uiSchema,
    registry,
    errorSchema,
    onDelete,
    unitOfMeasure,
    formData = {},
    branch,
  } = props;

  // Extract options with defaults
  const options = uiSchema?.['ui:options'] || {};
  const {
    readOnly = false,
    allowDelete = true,
    requireEditButton = false,
    binding = {},
    multiValuedSchemes = [],
  } = options;

  const [editMode, setEditMode] = useState(!readOnly && !requireEditButton);
  const [packSize, setPackSize] = useState(
    formData?.packSize?.toString() || '',
  );

  // Update local state when formData changes
  useEffect(() => {
    setPackSize(formData?.packSize?.toString() || '');
  }, [formData?.packSize]);

  const nonDefiningProperties = sortNonDefiningProperties(
    formData?.nonDefiningProperties || [],
  );

  const handlePackSizeChange = (newValue: string) => {
    setPackSize(newValue);
    const parsedValue = newValue === '' ? undefined : parseInt(newValue, 10);
    const updated = {
      ...formData,
      packSize: parsedValue,
    };
    onChange(updated);
  };

  const handleExternalIdentifiersChange = (updated: any[]) => {
    const current = {
      ...formData,
      nonDefiningProperties: updated,
    };
    onChange(current);
  };

  const isValidPackSize =
    packSize && !isNaN(parseInt(packSize, 10)) && parseInt(packSize, 10) > 0;

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
          {/* Pack Size Input */}
          <Stack direction="row" alignItems="center" gap={1}>
            {readOnly || (requireEditButton && !editMode) ? (
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {formData?.packSize ?? 'N/A'}
              </Typography>
            ) : (
              <TextField
                label="Pack Size"
                type="number"
                value={packSize}
                onChange={e => handlePackSizeChange(e.target.value)}
                error={packSize !== '' && !isValidPackSize}
                helperText={
                  packSize !== '' && !isValidPackSize
                    ? 'Pack size must be a positive number'
                    : ''
                }
                sx={{ maxWidth: '200px' }}
                inputProps={{ min: 1 }}
              />
            )}

            {unitOfMeasure && (
              <Typography variant="body1" color="textSecondary">
                {unitOfMeasure.pt?.term}
              </Typography>
            )}
          </Stack>

          {/* External Identifiers */}
          <ExternalIdentifiers
            formData={nonDefiningProperties}
            onChange={handleExternalIdentifiersChange}
            schema={schema?.properties?.externalIdentifiers}
            uiSchema={{
              'ui:options': {
                readOnly: readOnly || (requireEditButton && !editMode),
                binding,
                multiValuedSchemes,
              },
            }}
            registry={registry}
            formContext={formContext}
            branch={branch}
          />
        </Stack>
      </Box>
    </Box>
  );
};

export default PackDetails;
