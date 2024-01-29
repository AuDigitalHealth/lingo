import React from 'react';
import { Box } from '@mui/material';
import { CSSObject } from '@emotion/react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  sx?: CSSObject;
}
export default function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, sx, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3, ...sx }}>
          <div>{children}</div>
        </Box>
      )}
    </div>
  );
}
export function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}
