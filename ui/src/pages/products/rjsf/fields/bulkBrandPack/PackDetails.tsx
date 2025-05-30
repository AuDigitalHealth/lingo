// components/rjsf/templates/PackDetails.tsx

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
import ExternalIdentifiers from './ExternalIdentifiers.tsx';
import { sortExternalIdentifiers } from '../../../../../utils/helpers/tickets/additionalFieldsUtils.ts';
import EditIcon from '@mui/icons-material/Edit';
import { FieldProps } from '@rjsf/utils';

const PackDetails: React.FC<FieldProps> = props => {
  const {
    onChange,
    formContext,
    schema,
    uiSchema,
    registry,
    errorSchema,
    onDelete,
    unitOfMeasure,
  } = props;
  const { readOnly, allowDelete, requireEditButton } =
    (uiSchema && uiSchema['ui:options']) || {};

  //   const [formData, setFormData] = useState(props.formData || {});
  const formData = props.formData || {};
  const externalIdentifiers = sortExternalIdentifiers(
    formData?.externalIdentifiers || [],
  );
  const [editMode, setEditMode] = useState(
    (!readOnly && !requireEditButton) || false,
  );

  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          right: 30,
        }}
      >
        {!readOnly && requireEditButton && (
          <Tooltip title={editMode ? 'Done' : 'Edit'}>
            <IconButton
              edge="end"
              aria-label="edit"
              onClick={() => setEditMode(prev => !prev)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
        {!readOnly && allowDelete && onDelete && (
          <Tooltip
            title="Delete"
            sx={{
              marginLeft: 2,
            }}
          >
            <IconButton
              edge="end"
              aria-label="delete"
              disabled={!editMode}
              onClick={() => onDelete(formData)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        sx={{ width: '100%', paddingBottom: '1em' }}
      >
        <Stack gap={1}>
          <Stack flexDirection={'row'}>
            {readOnly || !editMode ? (
              <Typography variant="body1" sx={{ mr: 1, fontWeight: 'bold' }}>
                {formData?.packSize ?? 'N/A'}
              </Typography>
            ) : (
              <TextField
                label="Pack Size"
                sx={{ maxWidth: '200px' }}
                schema={schema?.properties?.packSize}
                uiSchema={uiSchema?.packSize}
                value={formData?.packSize}
                defaultValue={1}
                type={'number'}
                onChange={e => {
                  const newValue = parseInt(e.target.value, 10);
                  const updated = {
                    ...formData,
                    packSize: isNaN(newValue) ? undefined : newValue,
                  };
                  onChange(updated);
                }}
              />
            )}
            {unitOfMeasure && (
              <Typography variant="body1" color="textSecondary">
                {unitOfMeasure.pt.term}
              </Typography>
            )}
          </Stack>
          <ExternalIdentifiers
            sx={{ margin: 1 }}
            formData={externalIdentifiers}
            onChange={updated => {
              const current = { ...formData, externalIdentifiers: updated };
              onChange(current);
            }}
            schema={schema?.properties?.externalIdentifiers}
            uiSchema={uiSchema}
            // uiSchema={{
            //   ...(uiSchema?.externalIdentifiers || {}),
            //   'ui:options': {
            //     ...(uiSchema?.externalIdentifiers?.['ui:options'] || {}),
            //     readOnly: readOnly || !editMode,
            //   },
            // }}
            registry={registry}
          />
        </Stack>
      </Box>
    </>
  );
};

export default PackDetails;
