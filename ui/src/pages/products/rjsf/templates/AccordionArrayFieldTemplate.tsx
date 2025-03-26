import React, { useState } from 'react';
import { ArrayFieldTemplateProps } from '@rjsf/utils';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import SearchAndAddIcon from '../../../../components/icons/SearchAndAddIcon';
import SearchAndAddProduct from '../components/SearchAndAddProduct.tsx';
import useSearchAndAddProduct from '../hooks/useSearchAndAddProduct.ts';
import { getItemTitle } from '../helpers/helpers.ts';

const containerStyle = {
  marginBottom: '10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
};

const AccordionArrayFieldTemplate: React.FC<ArrayFieldTemplateProps> = ({
  items,
  canAdd,
  onAddClick,
  title,

  uiSchema,
  formData,
  formContext,
  idSchema,
}) => {
  const [expandedPanels, setExpandedPanels] = useState<string[]>([]);
  const {
    openSearchModal,
    handleOpenSearchModal,
    handleCloseSearchModal,
    handleAddProduct,
  } = useSearchAndAddProduct(formContext, idSchema);

  const handleChange =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedPanels(prev =>
        isExpanded ? [...prev, panel] : prev.filter(p => p !== panel),
      );
    };

  return (
    <div>
      {title && (
        <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 2 }}>
          {title}
        </Typography>
      )}

      {items.map(element => {
        const itemTitle = getItemTitle(uiSchema, formData, element.index);

        return (
          <Box key={element.index}>
            <Accordion
              expanded={expandedPanels.includes(`panel${element.index}`)}
              onChange={handleChange(`panel${element.index}`)}
              sx={containerStyle}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{itemTitle}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  {React.cloneElement(element.children, { title: itemTitle })}
                  {element.hasRemove && (
                    <IconButton
                      onClick={element.onDropIndexClick(element.index)}
                    >
                      <RemoveCircleOutlineIcon color="error" />
                    </IconButton>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
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

export default AccordionArrayFieldTemplate;
