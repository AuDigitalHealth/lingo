import React from 'react';
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { NonDefiningProperty } from '../../../../types/product';

interface AdditionalFieldDisplayProps {
  entry: NonDefiningProperty;
  onDelete?: () => void;
  showDelete?: boolean;
}

const AdditionalFieldDisplay: React.FC<AdditionalFieldDisplayProps> = ({
  entry,
  onDelete,
  showDelete = true,
}) => {
  return (
    <Box sx={{ mb: 2, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            alignItems: 'center',
          }}
        >
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, color: 'text.secondary' }}
          >
            {entry.identifierScheme.toUpperCase()}:
          </Typography>

          {/* Main Value Chip */}
          <Tooltip title={entry.value} arrow>
            <Chip
              label={
                <Box component="span" sx={{ fontWeight: 'bold' }}>
                  {entry.value}
                </Box>
              }
              color="primary"
              variant="outlined"
              sx={{
                px: 1.5,
                py: 0.5,
                maxWidth: 240,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            />
          </Tooltip>

          {/* Additional Fields */}
          {entry.additionalFields &&
            Object.entries(entry.additionalFields).map(([key, value]) => (
              <React.Fragment key={key}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: 'text.secondary',
                    minWidth: 'fit-content',
                  }}
                >
                  {key.toUpperCase()}:
                </Typography>
                <Tooltip title={value.value} arrow>
                  <Chip
                    label={
                      <Box component="span" sx={{ fontWeight: 'bold' }}>
                        {value.value}
                      </Box>
                    }
                    variant="outlined"
                    sx={{
                      bgcolor: '#f3f3f3',
                      borderColor: '#ccc',
                      px: 1.5,
                      py: 0.5,
                      maxWidth: 240,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  />
                </Tooltip>
              </React.Fragment>
            ))}
        </Box>

        {showDelete && onDelete && (
          <Tooltip title="Delete Entry">
            <IconButton onClick={onDelete}>
              <RemoveCircleOutlineIcon color="error" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default AdditionalFieldDisplay;
