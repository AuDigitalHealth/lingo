import React from 'react';
import { ArrayFieldTemplateProps } from '@rjsf/utils';
import { Box, Button, Chip } from '@mui/material';
import AddCircle from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';

const FieldChipsArrayTemplate: React.FC<ArrayFieldTemplateProps> = (props) => {
    const { items, canAdd, onAddClick, formData, uiSchema, registry } = props;
    const options = uiSchema['ui:options'] || {};
    const addButtonText = options.addButtonText || 'Add Item';
    const labelKey = options.labelKey || 'name'; // Default key for label, configurable via uiSchema

    // Get the array data from formData using the field name from the schema
    const fieldName = props.name; // RJSF provides the field name (e.g., "brands")
    const arrayData = formData[fieldName] || [];

    // Function to generate a label for each item
    const getItemLabel = (item: any) => {
        if (options.labelFormatter) {
            // Use a custom formatter if provided in uiSchema
            return options.labelFormatter(item);
        }
        // Default label: try labelKey, then stringify the item
        return item[labelKey] || JSON.stringify(item) || 'Unnamed Item';
    };

    return (
        <Box sx={{ width: '100%', padding: '10px' }}>
            {/* Display existing items as chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {arrayData.map((item: any, index: number) => (
                    <Chip
                        key={item.conceptId || index} // Use conceptId if available, otherwise index
                        label={getItemLabel(item)}
                        onDelete={items[index]?.hasRemove ? () => items[index].onDropIndexClick(index)() : undefined}
                        deleteIcon={<DeleteIcon />}
                        sx={{ mr: 1, mb: 1 }}
                    />
                ))}
            </Box>
            {/* Input fields for adding a new item */}
            <Box sx={{ mb: 2 }}>
                {items.length > 0 && items[items.length - 1].children}
            </Box>
            {/* Add button */}
            {canAdd && (
                <Button
                    variant="outlined"
                    startIcon={<AddCircle />}
                    onClick={onAddClick}
                    sx={{ mt: 1 }}
                >
                    {addButtonText}
                </Button>
            )}
        </Box>
    );
};

export default FieldChipsArrayTemplate;