import React from 'react';
import { WidgetProps } from '@rjsf/core';
import { Typography, Box } from '@mui/material';

const TitleWidget: React.FC<WidgetProps> = ({ value }) => {
  return (
    <Box
      sx={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}
    >
      <Typography variant="h6" fontWeight="bold">
        {value || 'No product selected'}
      </Typography>
    </Box>
  );
};

export default TitleWidget;
