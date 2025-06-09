import React from 'react';
import { ArrayFieldTemplateProps } from '@rjsf/utils';
import { Box, List, ListItem, Typography, Divider } from '@mui/material';
import PackDetails from '../../fields/bulkBrandPack/PackDetails.tsx';

const PackSizeArrayTemplate: React.FC<ArrayFieldTemplateProps> = props => {
  const { items, uiSchema, registry, formData, onChange, schema, title } =
    props;

  const { formContext } = registry;
  const options = uiSchema?.['ui:options'] || {};
  const {
    listTitle = title || 'Pack Sizes',
    readOnly = false,
    allowDelete = true,
    requireEditButton = false,
    skipTitle = false,
    binding = {},
    multiValuedSchemes = [],
  } = options;

  // Get unitOfMeasure from context
  const unitOfMeasure =
    formContext?.formData?.unitOfMeasure || formContext?.unitOfMeasure;

  const handleDeletePackSize = (index: number) => {
    const element = items[index];
    if (element?.onDropIndexClick) {
      element.onDropIndexClick(index)();
    }

    // Also notify through formContext
    if (formContext?.onFormDataChange) {
      const newPackSizes = formData.filter((_: any, i: number) => i !== index);
      const fieldName = schema?.title?.toLowerCase().includes('existing')
        ? 'existingPackSizes'
        : 'packSizes';

      const newFormData = {
        ...formContext.formData,
        [fieldName]: newPackSizes,
      };
      formContext.onFormDataChange(newFormData);
    }
  };

  const handlePackDetailsChange = (index: number, updatedPackData: any) => {
    const newFormData = [...formData];
    newFormData[index] = updatedPackData;
    onChange(newFormData);

    // Also notify through formContext
    if (formContext?.onFormDataChange) {
      const fieldName = schema?.title?.toLowerCase().includes('existing')
        ? 'existingPackSizes'
        : 'packSizes';

      const newContextData = {
        ...formContext.formData,
        [fieldName]: newFormData,
      };
      formContext.onFormDataChange(newContextData);
    }
  };

  return (
    <Box>
      {!skipTitle && listTitle && (
        <Typography variant="h6" gutterBottom>
          {listTitle}
        </Typography>
      )}

      <List
        sx={{
          border: 1,
          borderColor: 'grey.300',
          borderRadius: 1,
          p: 1,
          bgcolor: 'background.paper',
        }}
      >
        {items.length > 0 ? (
          items.map((element, index) => {
            const packFormData = element.children.props.formData;

            return (
              <React.Fragment key={element.key || index}>
                <ListItem
                  sx={{
                    position: 'relative',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    py: 2,
                  }}
                >
                  <PackDetails
                    {...element.children.props}
                    formData={packFormData}
                    onChange={(updatedData: any) =>
                      handlePackDetailsChange(index, updatedData)
                    }
                    onDelete={
                      allowDelete
                        ? () => handleDeletePackSize(index)
                        : undefined
                    }
                    unitOfMeasure={unitOfMeasure}
                    index={index}
                    uiSchema={{
                      ...(element.children.props.uiSchema || {}),
                      'ui:options': {
                        ...(element.children.props.uiSchema?.['ui:options'] ||
                          {}),
                        readOnly,
                        allowDelete,
                        requireEditButton,
                        binding,
                        multiValuedSchemes,
                      },
                    }}
                    schema={element.children.props.schema}
                    registry={registry}
                    formContext={formContext}
                    errorSchema={element.children.props.errorSchema}
                  />
                </ListItem>
                {index < items.length - 1 && <Divider />}
              </React.Fragment>
            );
          })
        ) : (
          <ListItem>
            <Typography variant="body2" color="textSecondary">
              No pack sizes added
            </Typography>
          </ListItem>
        )}
      </List>
    </Box>
  );
};

export default PackSizeArrayTemplate;
