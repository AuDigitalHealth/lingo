import React from 'react';
import { ArrayFieldTemplateProps } from '@rjsf/utils';
import { Box, List, ListItem, Typography } from '@mui/material';
import PackDetails from '../../fields/bulkBrandPack/PackDetails.tsx';

const PackSizeArrayTemplate: React.FC<ArrayFieldTemplateProps> = props => {
  const { items, uiSchema, registry } = props;
  const { formContext } = registry;

  const options = uiSchema['ui:options'] || {};
  const listTitle = options.listTitle || 'Pack Sizes';
  const isReadOnly = !!options.readOnly ?? true;
  const allowDelete = !!options.allowDelete ?? true;
  const requireEditButton = !!options.requireEditButton ?? true;

  const unitOfMeasure = formContext.formData?.unitOfMeasure;

  const [formData, setFormData] = React.useState(props.formData || []);

  const handleDeletePackSize = (packDetails: any) => {
    const currentFormData = { ...formContext.formData };
    // @ts-ignore
    currentFormData?.packSizes?.splice(
      currentFormData?.packSizes.indexOf(packDetails),
      1,
    );
    formContext.onFormDataChange(currentFormData);
  };

  return (
    <Box>
      <List sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, p: 1 }}>
        {items.length > 0 ? (
          items.map((element, index) => (
            <PackDetails
              {...element.children.props}
              key={index}
              index={index}
              unitOfMeasure={unitOfMeasure}
              onDelete={handleDeletePackSize}
              uiSchema={{
                'ui:options': {
                  readOnly: isReadOnly,
                  allowDelete: allowDelete,
                  requireEditButton: requireEditButton,
                },
              }}
              sx={{
                '& .MuiListItemSecondaryAction-root': {
                  top: '20px',
                },
              }}
            />
          ))
        ) : (
          <ListItem>
            <Typography variant="body1">No pack sizes added</Typography>
          </ListItem>
        )}
      </List>
    </Box>
  );
};

export default PackSizeArrayTemplate;
