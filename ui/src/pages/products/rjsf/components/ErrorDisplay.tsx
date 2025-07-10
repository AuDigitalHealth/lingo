import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import ReportIcon from '@mui/icons-material/Report';

interface ErrorDisplayProps {
  errors: any[];
  sx?: object;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errors, sx }) => {
  if (errors.length === 0) return null;

  return (
    <Box
      role="alert"
      aria-live="polite"
      sx={{
        backgroundColor: '#ffffff',
        border: '1px solid #d3d3d3', // light grey border
        borderRadius: 2,
        p: 2,
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)', // subtle shadow
        ...sx,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Errors:
      </Typography>
      <List dense disablePadding>
        {errors.map((error, index) => (
          <ListItem
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 0,
              py: 0.5,
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <ReportIcon sx={{ color: '#F04134', fill: '#F04134' }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Tooltip
                  title={error.property || error.instancePath || 'Root'}
                  arrow
                  placement="right"
                >
                  <Typography variant="body2">{error.stack}</Typography>
                </Tooltip>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
