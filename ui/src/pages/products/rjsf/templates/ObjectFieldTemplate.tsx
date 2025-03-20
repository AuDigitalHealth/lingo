import React from 'react';
import { ObjectFieldTemplateProps } from '@rjsf/utils';
import { Box, Grid } from '@mui/material';

const ObjectFieldTemplate: React.FC<ObjectFieldTemplateProps> = props => {
  const { properties, uiSchema } = props;
  const layout = uiSchema?.['ui:options']?.layout?.grid || [];

  // If no layout is specified, render properties in default order
  if (!layout.length) {
    return (
      <Box>
        {properties.map(prop => (
          <Box key={prop.name} sx={{ mb: 2 }}>
            {prop.content}
          </Box>
        ))}
      </Box>
    );
  }

  // Map properties to a lookup for easy access
  const propMap = properties.reduce(
    (acc, prop) => {
      acc[prop.name] = prop.content;
      return acc;
    },
    {} as Record<string, React.ReactNode>,
  );

  // Render according to layout
  return (
    <Box>
      <Grid container spacing={2}>
        {layout.map((item: { name: string; xs: number }, index: number) => (
          <Grid item xs={item.xs} key={item.name || index}>
            {propMap[item.name] || null}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ObjectFieldTemplate;
