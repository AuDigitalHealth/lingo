import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import Typography from '@mui/material/Typography';
import _ from 'lodash';
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function ArrayFieldTemplateAccordion(props) {
  const {
    TitleField,
    DescriptionField,
    items,
    canAdd,
    onAddClick,
    title,
    description,
    uiSchema,
    formData,
    formContext,
  } = props;
  const defaultTitle = uiSchema['ui:options']?.defaultTitle || 'Item';
  const titleSource = uiSchema.items?.['ui:options']?.titleSource;

  // State to manage which accordion is open
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <div>
      {(title || uiSchema['ui:title']) && (
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: 'bold', mt: 2 }}
        >
          {title || uiSchema['ui:title']}
        </Typography>
      )}
      {description && <DescriptionField description={description} />}

      {items &&
        items.map(element => {
          // Check if the field should be skipped
          const currentOptions = element.uiSchema['ui:options'] || {};
          const newOptions = {
            ...currentOptions,
            skipTitle: true,
          };
          element.uiSchema['ui:options'] = newOptions;

          let itemTitle = defaultTitle;
          if (titleSource && formData && formData[element.index]) {
            itemTitle =
              _.get(formData[element.index], titleSource) ||
              `${defaultTitle} ${element.index + 1}`;
          }

          // Clone element.children with updated title prop
          const updatedChildren = React.cloneElement(element.children, {
            title: itemTitle,
          });

          return (
            <Accordion
              key={element.index}
              expanded={expanded === `panel${element.index}`}
              onChange={handleChange(`panel${element.index}`)}
              sx={{
                marginBottom: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#f9f9f9',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel${element.index}a-content`}
                id={`panel${element.index}a-header`}
              >
                <Typography>{itemTitle}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  {updatedChildren}
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
}

export default ArrayFieldTemplateAccordion;
