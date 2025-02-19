import React, { useState } from 'react';
import { ArrayFieldTemplateProps } from '@rjsf/utils';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { getItemTitle } from '../helpers/helpers.ts';

const containerStyle = {
  marginBottom: '10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  backgroundColor: '#f9f9f9',
};

const AccordionArrayFieldTemplate: React.FC<ArrayFieldTemplateProps> = ({
  items,
  canAdd,
  onAddClick,
  title,
  description,
  uiSchema,
  formData,
  DescriptionField,
}) => {
  const [expanded, setExpanded] = useState<string | false>(false);
  const handleChange =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
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
          <Accordion
            key={element.index}
            expanded={expanded === `panel${element.index}`}
            onChange={handleChange(`panel${element.index}`)}
            sx={containerStyle}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              id={`panel${element.index}a-header`}
            >
              <Typography>{itemTitle}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                {React.cloneElement(element.children, { title: itemTitle })}
                {element.hasRemove && (
                  <IconButton onClick={element.onDropIndexClick(element.index)}>
                    <RemoveCircleOutlineIcon color="error" />
                  </IconButton>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
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
};

export default AccordionArrayFieldTemplate;
