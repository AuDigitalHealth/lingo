import React from 'react';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import Typography from '@mui/material/Typography';
import _ from 'lodash';
import { Box } from '@mui/material';  // Import Box component from MUI

function ArrayFieldTemplate(props) {
    const { TitleField, DescriptionField, items, canAdd, onAddClick, title, description, uiSchema, formData, formContext } = props;
    const defaultTitle = uiSchema['ui:options']?.defaultTitle || 'Item';
    const titleSource = uiSchema.items?.['ui:options']?.titleSource;

    return (
        <div>
            {(title || uiSchema['ui:title']) && (
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                    {title || uiSchema['ui:title']}
                </Typography>
            )}
            {description && <DescriptionField description={description} />}

            {items &&
                items.map((element) => {
                    // Check if the field should be skipped
                    const currentOptions = element.uiSchema['ui:options'] || {};
                    const newOptions = {
                        ...currentOptions, // Spread the existing options
                        skipTitle: true, // Example: Skip the first field
                    };
                    element.uiSchema['ui:options'] = newOptions; // Set the merged options

                    // Dynamically determine the title using titleSource
                    let itemTitle = defaultTitle;
                    if (titleSource && formData && formData[element.index]) {
                        itemTitle = _.get(formData[element.index], titleSource) || `${defaultTitle} ${element.index + 1}`;
                    }
                    // Modify element.children props to set title
                    const updatedChildren = React.cloneElement(element.children, {
                        title: itemTitle, // Update the title prop for the children
                    });

                    return (
                        <Box
                            key={element.index}
                            sx={{
                                marginBottom: '10px',
                                border: '1px solid #ccc',
                                padding: '10px',
                                borderRadius: '4px',
                                backgroundColor: '#f9f9f9', // Background color applied by default
                            }}
                        >
                            {updatedChildren}
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
}

export default ArrayFieldTemplate;
