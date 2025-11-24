import React, { useEffect, useState } from 'react';
import {
  Box,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { FieldProps } from '@rjsf/utils';
import ExternalIdentifiers from './ExternalIdentifiers.tsx';
import { sortNonDefiningProperties } from '../../../../../utils/helpers/tickets/additionalFieldsUtils.ts';
import { RjsfUtils } from '../../helpers/rjsfUtils.ts';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAddButton } from '../../../hooks/useAddButton.ts';
import { packSizeValidation } from '../../helpers/validationHelper.ts';

interface PackDetailsProps extends FieldProps {
  onDelete?: () => void;
  unitOfMeasure?: any;
  index?: number;
  onCopyNonDefiningProperties?: () => void;
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
    propertyOrder = [],
  } = nonDefiningPropertyOptions;

  const {
    readOnly = false,
    allowDelete = true,
    requireEditButton = false,
    nondefiningPropertyTitle,
    inputType,
    disablePackSizeEdit,
    allowCopy = false,
  } = packSizeUiSchemaOptions;

  let isNumber = schema?.type === 'number' || schema?.type === 'integer';
  if (inputType && inputType === 'text') {
    isNumber = false;
  }

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

  const handleNonDefiningPropertiesChange = (updated: any[]) => {
    const current = {
      ...formData,
      nonDefiningProperties: updated,
    };
    onChange(current);
  };

  const isValidPackSize =
    packSize && !isNaN(parseInt(packSize, 10)) && parseInt(packSize, 10) > 0;
  const {
    tooltipTitle = 'Add Pack Size',
    sourcePath = 'newPackSizeInput',
    targetPath = 'packSizes',
    existingPath = 'existingPackSizes',
  } = {};
  const getInitialPackSizeData = () => ({
    packSize: undefined,
    nonDefiningProperties:
      formContext.formData.newPackSizeInput.nonDefiningProperties,
  });
  const { handleAddClick, isEnabled } = useAddButton({
    formContext,
    sourcePath,
    targetPath,
    existingPath,
    validationFn: packSizeValidation,
    getInitialSourceData: getInitialPackSizeData,
  });

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
          {/* Pack Size Input */}
          <Stack direction="row" alignItems="center" gap={1}>
            {readOnly ||
            disablePackSizeEdit ||
            (requireEditButton && !editMode) ? (
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {formData?.packSize ?? 'N/A'}
              </Typography>
            ) : (
              <TextField
                label="Pack Size"
                type="number"
                value={packSize}
                onChange={e => handlePackSizeChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (isEnabled) {
                      handleAddClick();
                    }
                  }
                }}
                error={
                  (packSize !== '' && !isValidPackSize) ||
                  (packSize !== '' && !isEnabled)
                }
                helperText={
                  packSize !== '' && !isValidPackSize
                    ? 'Pack size must be a positive number'
                    : packSize !== '' && !isEnabled
                      ? 'Invalid Pack Size'
                      : ''
                }
                type={isNumber ? 'number' : 'text'}
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
            onChange={handleNonDefiningPropertiesChange}
            schema={schema?.properties?.nonDefiningProperties}
            uiSchema={{
              'ui:options': {
                readOnly: readOnly,
                binding,
                multiValuedSchemes,
                propertyOrder,
                label: nondefiningPropertyTitle,
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
