import React, { useEffect } from 'react';
import { WidgetProps } from '@rjsf/utils';
import {
    Box,
    IconButton,
    Typography,
    TextField,
} from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const ArtgArrayWidget: React.FC<WidgetProps> = (props) => {
    const {
        schema,
        id,
        value,
        onChange,
        required,
        disabled,
        readonly,
        uiSchema,
        rawErrors, // RJSF validation errors
    } = props;

    if (!schema.items) {
        console.error('ArtgArrayWidget expects an array schema with items:', schema);
        return <div>Error: Expected an array schema with items</div>;
    }

    const items = Array.isArray(value) ? value : [];
    const title = uiSchema['ui:options']?.title || schema.title || 'External Identifiers';
    const itemSchema = schema.items as any;

    // Detect submission attempt via rawErrors
    const submitAttempted = !!rawErrors?.length;

    useEffect(() => {
        if (required && items.length === 0) {
            addItem(); // Enforce at least one item if required
        }
    }, [required]);

    const addItem = () => {
        const newItem = {
            identifierScheme: 'artgid',
            relationshipType: 'RELATED',
            identifierValue: '',
        };
        const newItems = [...items, newItem];
        onChange(newItems);
    };

    const updateItem = (index: number, updated: any) => {
        const newItems = [...items];
        newItems[index] = updated;
        onChange(newItems);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        onChange(newItems.length ? newItems : undefined); // Clear if empty
    };

    const isRemoveDisabled = (index: number) => {
        return required && items.length === 1; // Disable remove if required and only one item
    };

    const getUnfilledItems = () => {
        return items.filter(
            (item) => !item.identifierValue || item.identifierValue === ''
        ).length;
    };

    const unfilledCount = getUnfilledItems();

    return (
        <Box>
            {title && (
                <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 2 }}>
                    {title}
                </Typography>
            )}

            {items.map((item: any, index: number) => {
                const isMandatoryUnfilled =
                    required && (!item.identifierValue || item.identifierValue === '');
                const patternError =
                    itemSchema.properties.identifierValue.pattern &&
                    !new RegExp(itemSchema.properties.identifierValue.pattern).test(
                        item.identifierValue || ''
                    );
                const errorMessage =
                    submitAttempted && isMandatoryUnfilled
                        ? 'This field is required'
                        : patternError
                            ? itemSchema.properties.identifierValue.errorMessage?.pattern ||
                            'Invalid format'
                            : '';

                return (
                    <Box
                        key={`${id}-${index}`}
                        sx={{
                            mb: 2,
                            border: '1px solid #ddd',
                            p: 2,
                            borderRadius: '4px',
                            position: 'relative',
                            ...(submitAttempted && isMandatoryUnfilled && {
                                borderColor: 'error.main',
                            }),
                        }}
                    >
                        <TextField
                            label={itemSchema.properties.identifierValue.title || 'ARTGID'}
                            value={item.identifierValue || ''}
                            onChange={(e) =>
                                updateItem(index, {
                                    ...item,
                                    identifierValue: e.target.value,
                                })
                            }
                            fullWidth
                            disabled={disabled || readonly}
                            error={!!errorMessage}
                            helperText={errorMessage}
                            sx={{ mb: 1, mt: 1 }}
                        />
                        {!readonly && !disabled && (
                            <IconButton
                                onClick={() => removeItem(index)}
                                disabled={isRemoveDisabled(index)}
                                sx={{ position: 'absolute', top: 8, right: 8 }}
                            >
                                <RemoveCircleOutlineIcon
                                    color={isRemoveDisabled(index) ? 'disabled' : 'error'}
                                />
                            </IconButton>
                        )}
                    </Box>
                );
            })}

            {/* Global validation warning */}
            {submitAttempted && unfilledCount > 0 && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                    Please fill in all required ARTG IDs.
                </Typography>
            )}

            {!readonly && !disabled && (
                <Box sx={{ mt: 1 }}>
                    <IconButton onClick={addItem}>
                        <AddCircleOutlineIcon color="primary" />
                    </IconButton>
                </Box>
            )}
        </Box>
    );
};

export default ArtgArrayWidget;