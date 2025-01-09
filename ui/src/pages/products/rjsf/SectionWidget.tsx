import React from 'react';
import { WidgetProps } from '@rjsf/core';
import { Typography, Grid } from '@mui/material';

const SectionWidget = ({
  schema,
  uiSchema,
  formData,
  children,
}: WidgetProps) => {
  // Retrieve the title field path from ui:options
  const titleFieldPath =
    uiSchema['ui:options']?.productNameField || 'productDetails.productName';

  // Dynamically find the value of the title field from formData
  const titleFieldParts = titleFieldPath.split('.');
  let titleValue = formData;

  titleFieldParts.forEach(part => {
    titleValue = titleValue ? titleValue[part] : undefined;
  });

  const title = titleValue || 'Untitled Product'; // Fallback title if productName is not found

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Section Title */}
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>

      {/* Wrap fields inside Grid for layout */}
      <Grid container spacing={2}>
        {children} {/* Render the fields inside the section */}
      </Grid>
    </div>
  );
};

export default SectionWidget;
