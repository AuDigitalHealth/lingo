import React from 'react';
import { Typography, Grid } from '@mui/material';

interface ErrorDisplayProps {
  errors: string[];
  sx?: object; // Optional styling for the Grid container
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errors, sx }) => {
  if (errors.length === 0) return null;

  return (
    <Grid item xs={12} sx={sx}>
      {errors.map((error, index) => (
        <Typography key={index} color="error" variant="caption" component="div">
          {error}
        </Typography>
      ))}
    </Grid>
  );
};
