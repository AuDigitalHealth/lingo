import React, { useState } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Box, Button } from '@mui/material';
import AddCircle from '@mui/icons-material/AddCircle';
import { FieldChips } from '../../components/ArtgFieldChips.tsx'; // Adjust path
import EclAutocomplete from '../fields/EclAutocomplete.tsx'; // Adjust path
import TextWidget from '@rjsf/mui'; // Default RJSF TextWidget

const BrandArrayWidget: React.FC<WidgetProps> = (props) => {
    const { schema, uiSchema, value = [], onChange, registry, id, required } = props;
    const { formContext, widgets } = registry;
    const options = uiSchema['ui:options'] || {};
    const addButtonText = options.addButtonText || 'Add Item';
    const labelKey = options.labelKey || 'name';
    const defaultLabel = options.defaultLabel || 'Unnamed Item';
    const eclOptions = options.eclOptions || {
        branch: 'MAIN',
        ecl: '<774167006',
        showDefaultOptions: false,
        label: 'Brand Name',
        placeholder: 'Search for a brand...',
    };

    // Local state for new item input
    const [newItem, setNewItem] = useState<{ brand?: any; externalIdentifiers?: string }>({});

    // Get the schema for array items
    const itemSchema = schema.items as any;
    const itemUiSchema = uiSchema.items || {};

    // Add new item to the array
    const handleAdd = () => {
        if (newItem.brand) { // Basic validation: ensure brand is set
            onChange([...value, {
                brand: newItem.brand,
                externalIdentifiers: newItem.externalIdentifiers?.split(',').map(id => id.trim()).filter(id => id) || [],
            }]);
            setNewItem({}); // Reset input fields
        } else {
            console.warn('Cannot add item: brand is required');
        }
    };

    // Remove item from the array
    const handleDelete = (index: number) => {
        const updatedValue = value.filter((_: any, i: number) => i !== index);
        onChange(updatedValue);
    };

    // Format items for FieldChips (generic)
    const getNestedValue = (obj: any, path: string) =>
        path.split('.').reduce((acc, part) => acc && acc[part], obj);
    const formattedItems = value.map((item: any, index: number) => ({
        ...item,
        identifierValue: getNestedValue(item, labelKey) || defaultLabel,
        onDelete: () => handleDelete(index),
    }));

    return (
        <Box sx={{ width: '100%', padding: '10px' }}>
            {/* Input area for adding a new item */}
            <Box sx={{ mb: 2 }}>
                {/* Brand input using EclAutocomplete */}
                <Box sx={{ mb: 1 }}>
                    <EclAutocomplete
                        value={newItem.brand || null}
                        onChange={(newValue: any) =>
                            setNewItem((prev) => ({ ...prev, brand: newValue }))
                        }
                        branch={eclOptions.branch}
                        ecl={eclOptions.ecl}
                        showDefaultOptions={eclOptions.showDefaultOptions}
                        label={eclOptions.label}
                        placeholder={eclOptions.placeholder}
                    />
                </Box>
                {/* External identifiers input using TextWidget */}
                <Box sx={{ mb: 1 }}>
                    <TextWidget
                        schema={itemSchema.properties.externalIdentifiers || { type: 'string' }}
                        uiSchema={itemUiSchema.externalIdentifiers || {}}
                        value={newItem.externalIdentifiers || ''}
                        onChange={(fieldValue: string) =>
                            setNewItem((prev) => ({ ...prev, externalIdentifiers: fieldValue }))
                        }
                        registry={registry}
                        formContext={formContext}
                        id={`${id}_externalIdentifiers`}
                        required={itemSchema.properties.externalIdentifiers?.required || false}
                    />
                </Box>
            </Box>
            {/* Add button */}