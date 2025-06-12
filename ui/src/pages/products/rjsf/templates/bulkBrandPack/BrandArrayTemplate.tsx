import React from 'react';
import { ArrayFieldTemplateProps } from '@rjsf/utils';
import { Box, Divider, List, ListItem, Typography } from '@mui/material';
import BrandDetails from '../../fields/bulkBrandPack/BrandDetails.tsx';

const BrandArrayTemplate: React.FC<ArrayFieldTemplateProps> = props => {
  const { items, uiSchema, registry, formData, onChange, schema, title, branch } =
    props;

  const { formContext } = registry;
  const options = uiSchema?.['ui:options'] || {};
  const {
    listTitle = title || 'Brands',
    readOnly = false,
    allowDelete = true,
    requireEditButton = false,
    skipTitle = false,
    mandatorySchemes = [],
    multiValuedSchemes = [],
  } = options;

  const handleDeleteBrand = (index: number) => {
    const element = items[index];
    if (element?.onDropIndexClick) {
      element.onDropIndexClick(index)();
    }

    // Also notify through formContext
    if (formContext?.onFormDataChange) {
      const newBrands = formData.filter((_: any, i: number) => i !== index);
      const fieldName = schema?.title?.toLowerCase().includes('existing')
        ? 'existingBrands'
        : 'brands';

      const newFormData = {
        ...formContext.formData,
        [fieldName]: newBrands,
      };
      formContext.onFormDataChange(newFormData);
    }
  };

  const handleBrandDetailsChange = (index: number, updatedBrandData: any) => {
    const newFormData = [...formData];
    newFormData[index] = updatedBrandData;
    onChange(newFormData);

    // Also notify through formContext
    if (formContext?.onFormDataChange) {
      const fieldName = schema?.title?.toLowerCase().includes('existing')
        ? 'existingBrands'
        : 'brands';

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
            const brandFormData = element.children.props.formData;

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
                  <BrandDetails
                    {...element.children.props}
                    formData={brandFormData}
                    onChange={(updatedData: any) =>
                      handleBrandDetailsChange(index, updatedData)
                    }
                    onDelete={
                      allowDelete ? () => handleDeleteBrand(index) : undefined
                    }
                    index={index}
                    uiSchema={{
                      ...(element.children.props.uiSchema || {}),
                      'ui:options': {
                        ...(element.children.props.uiSchema?.['ui:options'] ||
                          {}),
                        readOnly,
                        allowDelete,
                        requireEditButton,
                        mandatorySchemes,
                        multiValuedSchemes,
                      },
                    }}
                    schema={element.children.props.schema}
                    registry={registry}
                    formContext={formContext}
                    errorSchema={element.children.props.errorSchema}
                    branch={branch}
                  />
                </ListItem>
                {index < items.length - 1 && <Divider />}
              </React.Fragment>
            );
          })
        ) : (
          <ListItem>
            <Typography variant="body2" color="textSecondary">
              No brands added
            </Typography>
          </ListItem>
        )}
      </List>
    </Box>
  );
};

export default BrandArrayTemplate;
