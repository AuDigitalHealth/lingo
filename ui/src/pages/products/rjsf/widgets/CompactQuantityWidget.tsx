import React from 'react';
import { WidgetProps } from '@rjsf/core';
import { Grid, TextField, Box } from '@mui/material';
import AutoCompleteField from "../fields/AutoCompleteField.tsx";


const CompactQuantityWidget = ({
                                   id,
                                   value,
                                   required,
                                   onChange,
                                   schema,
                                   uiSchema,
                                   formContext,
                                   rawErrors = [],
                               }: WidgetProps) => {
    // Extract value and unit from the form data
    const currentValue = value?.value ?? '';
    const currentUnit = value?.unit || undefined;

    // Get title from uiSchema (with fallback)
    const title = uiSchema?.['ui:title'] || 'Quantity';

    // Get unit-specific options from uiSchema
    const unitOptions = uiSchema?.unit?.['ui:options'] || {};

    // Handle value change
    const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const numericValue = parseFloat(event.target.value);
        if (!isNaN(numericValue)) {
            const isEach = currentUnit?.conceptId === '732935002';
            const adjustedValue = isEach ? Math.max(1, Math.round(numericValue)) : numericValue;
            onChange({ ...value, value: adjustedValue });
        }
    };

    // Handle unit change
    const handleUnitChange = (selectedUnit: any | null) => {
        if (!selectedUnit) {
            // Remove unit and value if unit is cleared
            const updatedFormData = { ...value };
            delete updatedFormData.unit;
            delete updatedFormData.value;
            onChange(updatedFormData);
        } else {
            // Update unit and ensure value is set (default to 0 if not present)
            const isEach = selectedUnit.conceptId === '732935002';
            const adjustedValue = isEach ? Math.max(1, Math.round(currentValue || 0)) : (currentValue || 0);
            onChange({ ...value, unit: selectedUnit, value: adjustedValue });
        }
    };

    return (
        <Box width="100%">
            <Grid container spacing={1} alignItems="center">
                {/* Value field (number input) */}
                <Grid item xs={6}>
                    <TextField
                        id={`${id}-value`}
                        label="Value"
                        value={currentValue}
                        onChange={handleValueChange}
                        type="number"
                        fullWidth
                        variant="outlined"
                        required={required}
                        error={rawErrors.length > 0}
                        helperText={rawErrors.join(', ')}
                        size="small"
                        inputProps={{
                            min: currentUnit?.conceptId === '732935002' ? 1 : 0,
                            step: currentUnit?.conceptId === '732935002' ? 1 : 0.01,
                        }}
                        sx={{ mt: 0 }} // Align with AutoCompleteField
                    />
                </Grid>

                {/* Unit field with AutoCompleteField */}
                <Grid item xs={6}>
                    <AutoCompleteField
                        schema={schema?.properties?.unit || {}}
                        formData={currentUnit}
                        onChange={handleUnitChange}
                        uiSchema={{
                            'ui:options': {
                                ...unitOptions,
                            },
                        }}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default CompactQuantityWidget;