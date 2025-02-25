import React from 'react';
import { ArrayFieldTemplateProps } from '@rjsf/utils';
import { Box, Typography, IconButton } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { getItemTitle } from '../helpers/helpers.ts';

const containerStyle = {
  marginBottom: '10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  // backgroundColor: '#f9f9f9',
  padding: '10px',
};

const BoxArrayFieldTemplate: React.FC<ArrayFieldTemplateProps> = ({
  items,
  canAdd,
  onAddClick,
  title,
  description,
  uiSchema,
  formData,
  DescriptionField,
}) => (
  <div>
    {title && (
      <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 2 }}>
        {title}
      </Typography>
    )}
    {description && <DescriptionField description={description} />}

    {items.map(element => {
      element.uiSchema['ui:options'] = {
        ...(element.uiSchema['ui:options'] || {}),
        skipTitle: true,
      };
      const itemTitle = getItemTitle(uiSchema, formData, element.index);

      return (
        <Box key={element.index} sx={containerStyle}>
          {React.cloneElement(element.children, { title: itemTitle })}
          {element.hasRemove && (
            <IconButton onClick={element.onDropIndexClick(element.index)}>
              <RemoveCircleOutlineIcon color="error" />
            </IconButton>
          )}
        </Box>
      );
    })}

    {canAdd && (
      <div style={{ marginTop: '10px' }}>
        <IconButton onClick={onAddClick}>
          <AddCircleOutlineIcon color="primary" />
        </IconButton>
      </div>
    )}
  </div>
);

export default BoxArrayFieldTemplate;
