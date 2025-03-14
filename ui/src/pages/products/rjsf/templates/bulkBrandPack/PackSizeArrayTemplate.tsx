import React from 'react';
import { ArrayFieldTemplateProps } from '@rjsf/utils';
import { Box, IconButton, List, ListItem, ListSubheader, Tooltip, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MedicationIcon from '@mui/icons-material/Medication';
import { Avatar } from '@mui/material';
import { FieldChips } from "../../../components/ArtgFieldChips.tsx";
import { sortExternalIdentifiers } from "../../../../../utils/helpers/tickets/additionalFieldsUtils.ts";

const PackSizeArrayTemplate: React.FC<ArrayFieldTemplateProps> = (props) => {
    const { items, uiSchema, registry } = props;
    const { formContext } = registry;

    const options = uiSchema['ui:options'] || {};
    const listTitle = options.listTitle || 'Pack Sizes';
    const isReadOnly = options.readOnly || false;

    const unitOfMeasure = formContext.formData?.unitOfMeasure;

    const handleDelete = (index: number) => {
        const currentFormData = { ...formContext.formData };
        const fieldName = uiSchema['ui:options'].title === 'Existing Pack Sizes' ? 'existingPackSizes' : 'packSizes';
        const updatedPackSizes = [...(currentFormData[fieldName] || [])];
        updatedPackSizes.splice(index, 1);
        const updatedFormData = {
            ...currentFormData,
            [fieldName]: updatedPackSizes,
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
                            secondaryAction={!isReadOnly && element.hasRemove && (
                                <Tooltip title="Remove Pack Size">
                                    <IconButton
                                        edge="end"
                                        aria-label="delete"
                                        onClick={() => handleDelete(index)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                            sx={{ alignItems: 'flex-start', py: 0.5 }} // Tighten vertical padding
                        >
                            <Avatar sx={{ mr: 1, alignSelf: 'center' }}>
                                <MedicationIcon />
                            </Avatar>
                            <Box display="flex" flexDirection="column" sx={{ width: '100%' }}>
                                <Box display="flex" alignItems="center">
                                    <Typography variant="body1" sx={{ mr: 1 }}>
                                        {element.children.props.formData.packSize || 'N/A'}
                                    </Typography>
                                    {unitOfMeasure && (
                                        <Typography variant="body2" color="textSecondary">
                                            {unitOfMeasure.pt.term}
                                        </Typography>
                                    )}
                                </Box>
                                <FieldChips
                                    items={sortExternalIdentifiers(
                                        element.children.props.formData.externalIdentifiers || []
                                    )}
                                    sx={{ mt: 1 }}
                                />
                            </Box>
                        </ListItem>
                    ))
                ) : (
                    <ListItem>
                        <Typography variant="body1">No pack sizes added</Typography>
                    </ListItem>
                )}
            </List>
        </Box>
    );
};

export default PackSizeArrayTemplate;