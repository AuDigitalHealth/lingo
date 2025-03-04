import React from 'react';
import { ArrayFieldTemplateProps } from '@rjsf/utils';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import SearchAndAddIcon from '../../../../components/icons/SearchAndAddIcon';
import { getItemTitle } from '../helpers/helpers';
import SearchAndAddProduct from '../components/SearchAndAddProduct.tsx';
import useSearchAndAddProduct from '../hooks/useSearchAndAddProduct.ts'; // Import custom hook

const containerStyle: React.CSSProperties = {
  marginBottom: '10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  padding: '10px',
};

const BoxArrayFieldTemplate: React.FC<ArrayFieldTemplateProps> = ({
  items,
  canAdd,
  onAddClick,
  title,
  description,
  uiSchema,
  formData = [],
  DescriptionField,
  formContext,
  idSchema,
}) => {
  const {
    openSearchModal,
    handleOpenSearchModal,
    handleCloseSearchModal,
    handleAddProduct,
  } = useSearchAndAddProduct(formContext, idSchema);

  return (
    <div>
      {title && (
        <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 2 }}>
          {title}
        </Typography>
      )}
      {description && <DescriptionField description={description} />}

      {items.map(element => {
        const itemTitle = getItemTitle(uiSchema, formData, element.index);
        return (
          <Box key={element.key || element.index} sx={containerStyle}>
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
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
          <Tooltip title="Add Manually">
            <IconButton onClick={onAddClick}>
              <AddCircleOutlineIcon color="primary" />
            </IconButton>
          </Tooltip>
          {uiSchema?.['ui:options']?.searchAndAddProduct && (
            <Tooltip title="Search and Add">
              <IconButton onClick={handleOpenSearchModal}>
                <SearchAndAddIcon width="20px" />
              </IconButton>
            </Tooltip>
          )}
        </div>
      )}

      {uiSchema?.['ui:options']?.searchAndAddProduct && (
        <SearchAndAddProduct
          open={openSearchModal}
          onClose={handleCloseSearchModal}
          onAddProduct={handleAddProduct}
          uiSchema={uiSchema}
        />
      )}
    </div>
  );
};

export default BoxArrayFieldTemplate;
