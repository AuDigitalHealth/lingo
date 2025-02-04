import React from 'react';
import { ArrayFieldTemplateItemType } from '@rjsf/utils';
import { IconButton, Typography, Box } from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

const ArrayFieldItemTemplate = (props: ArrayFieldTemplateItemType) => {
  const {
    children,
    disabled,
    idSchema,
    index,
    onAddIndexClick,
    onDropIndexClick,
    onReorderClick,
    readonly,
    registry,
    required,
    schema,
    uiSchema,
    rawErrors,
    hasToolbar,
    hasMoveDown,
    hasMoveUp,
    hasRemove,
    formContext, // Receive formContext
  } = props;

  // // Access formData from formContext
  // const { formData } = formContext as { formData: any };
  // const itemFormData = formData?.[index];
  //
  // // Get title generation options from uiSchema
  // const titleSource = uiSchema?.["ui:options"]?.titleSource;
  // const defaultTitle = uiSchema?.["ui:options"]?.defaultTitle || `Product ${index + 1}`;
  //
  // // Function to extract value from an object based on a dot-separated path
  // const getNestedValue = (obj: any, path: string): any => {
  //     return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  // };
  //
  // // Get the title from formData based on titleSource
  // let itemTitle = defaultTitle;
  // if (titleSource) {
  //     const titleValue = getNestedValue(itemFormData, titleSource); // Use itemFormData
  //     if (titleValue) {
  //         itemTitle = titleValue;
  //     }
  // }

  return (
    <div style={{ marginBottom: '15px' }}>
      <Box
        display="flex"
        alignItems="center"
        border="1px solid #ccc"
        borderRadius="4px"
        padding="10px"
      >
        <Box flexGrow={1}>
          {/* Use dynamically generated title */}
          {/*<Typography variant="h6" gutterBottom>*/}
          {/*    {itemTitle}*/}
          {/*</Typography>*/}
          {/* Render the actual item content */}
          {children}
        </Box>
        {hasToolbar && (
          <Box>
            {(hasMoveUp || hasMoveDown) && (
              <IconButton
                color="secondary"
                onClick={onReorderClick(index, index - 1)}
                disabled={disabled || readonly || !hasMoveUp}
              >
                <i className="fas fa-arrow-up" />
              </IconButton>
            )}

            {(hasMoveUp || hasMoveDown) && (
              <IconButton
                color="secondary"
                onClick={onReorderClick(index, index + 1)}
                disabled={disabled || readonly || !hasMoveDown}
              >
                <i className="fas fa-arrow-down" />
              </IconButton>
            )}

            {hasRemove && (
              <IconButton
                color="secondary"
                onClick={onDropIndexClick(index)}
                disabled={disabled || readonly}
                style={{ marginRight: '15px' }}
              >
                <RemoveCircleOutlineIcon />
              </IconButton>
            )}
          </Box>
        )}
      </Box>
    </div>
  );
};

export default ArrayFieldItemTemplate;
