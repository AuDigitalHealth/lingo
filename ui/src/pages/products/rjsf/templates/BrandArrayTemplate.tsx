import React from 'react';
import { ArrayFieldTemplateProps } from '@rjsf/utils';
import {
    Avatar,
    Box,
    Button,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListSubheader,
} from '@mui/material';
import AddCircle from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import MedicationIcon from '@mui/icons-material/Medication';
import { FieldChips } from '../../components/ArtgFieldChips.tsx'; // Adjust path
import { sortExternalIdentifiers } from '../../../../utils/helpers/tickets/additionalFieldsUtils.ts';

const BrandArrayTemplate: React.FC<ArrayFieldTemplateProps> = (props) => {
    const { items, canAdd, onAddClick, formData, uiSchema } = props;
    const options = uiSchema['ui:options'] || {};
    const addButtonText = options.addButtonText || 'Add Item';
    const labelKey = options.labelKey || 'name'; // Default key for label, configurable via uiSchema
    const listTitle = options.listTitle || 'Added Brands'; // Configurable list subheader title
    const skipTitle = options.skipTitle || false; // Default to false (show title unless skipped)

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

    // Filter arrayData to only show items that have been fully added (not the in-progress item)
    const committedItems = items.map((item) => item.children.props.formData).filter(Boolean);

    return (
        <Box sx={{ width: '100%' }}>
            {/* Input fields for adding a new item wrapped in a Box */}
            <Box
                sx={{
                    border: 1,
                    borderColor: 'grey.300',
                    borderRadius: 1,
                    p: 1,
                    mb: 1,
                }}
            >
                {items.length > 0 && items[items.length - 1].children}
            </Box>
            {/* Add button */}
            {canAdd && (
                <Button
                    variant="outlined"
                    startIcon={<AddCircle />}
                    onClick={onAddClick}
                    sx={{ mt: 0, mb: 1 }}
                >
                    {addButtonText}
                </Button>
            )}
            {/* Display committed items as a list below with delete buttons */}
            <Box sx={{ mb: 0 }}>
                <List>
                    { <ListSubheader>{listTitle}</ListSubheader>}
                    {committedItems.map((item: any, index: number) =>
                        item.brand ? (
                            <ListItem
                                key={item.brand.id}
                                secondaryAction={
                                    <IconButton
                                        edge="end"
                                        aria-label="delete"
                                        onClick={items[index].onDropIndexClick(index)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar>
                                        <MedicationIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <Box>
                                    <ListItemText primary={item.brand.pt?.term} />
                                    <FieldChips items={sortExternalIdentifiers(item.externalIdentifiers)} />
                                </Box>
                            </ListItem>
                        ) : null // Skip items without brand
                    )}
                </List>
            </Box>
        </Box>
    );
};

export default BrandArrayTemplate;