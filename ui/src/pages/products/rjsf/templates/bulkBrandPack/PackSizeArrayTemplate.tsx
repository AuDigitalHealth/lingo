import React from 'react';
import { ArrayFieldTemplateProps } from '@rjsf/utils';
import { Box, IconButton, List, ListItem, ListItemText, ListSubheader, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MedicationIcon from '@mui/icons-material/Medication';
import { Avatar } from '@mui/material';

// Assuming FieldChips is available for rendering external identifiers


import {FieldChips} from "../../../components/ArtgFieldChips.tsx";
import {sortExternalIdentifiers} from "../../../../../utils/helpers/tickets/additionalFieldsUtils.ts";

const PackSizeArrayTemplate: React.FC<ArrayFieldTemplateProps> = (props) => {
    const { items, formData, uiSchema, onAddClick, registry } = props;
    const { formContext } = registry;

    // Get the list title from uiSchema or default to "Newly Added Pack Sizes"
    const options = uiSchema['ui:options'] || {};
    const listTitle = options.listTitle || 'Newly Added Pack Sizes';
    const isReadOnly = options.readOnly || false;

    // Handle delete action
    const handleDelete = (index: number) => {
        const currentFormData = { ...formContext.formData };
        const updatedPackSizes = [...(currentFormData.packSizes || [])];
        updatedPackSizes.splice(index, 1);
        const updatedFormData = {
            ...currentFormData,
            packSizes: updatedPackSizes,
        };
        formContext.onChange(updatedFormData);
    };

    return (
        <Box>
            <List
                subheader={<ListSubheader>{listTitle}</ListSubheader>}
                sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, p: 1 }}
            >
                {items.length > 0 ? (
                    items.map((element, index) => (
                        <ListItem
                            key={index}
                            secondaryAction={ !isReadOnly && element.hasRemove &&
                                (<Tooltip title="Remove Pack Size">
                                    <IconButton
                                        edge="end"
                                        aria-label="delete"
                                        onClick={() => handleDelete(index)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>)
                            }
                        >
                            <Avatar sx={{ mr: 2 }}>
                                <MedicationIcon />
                            </Avatar>
                            <Box>
                                <ListItemText
                                    primary={`${element.children.props.formData.packSize || 'N/A'}`}
                                />
                                <FieldChips
                                    items={sortExternalIdentifiers(
                                        element.children.props.formData.externalIdentifiers || []
                                    )}
                                />
                            </Box>
                        </ListItem>
                    ))
                ) : (
                    <ListItem>
                        <ListItemText primary="No new pack sizes added" />
                    </ListItem>
                )}
            </List>
        </Box>
    );
};

export default PackSizeArrayTemplate;