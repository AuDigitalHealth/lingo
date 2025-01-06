import React from 'react';
import { Grid, TextField, Typography } from '@mui/material';
import { WidgetProps } from '@rjsf/core';
import AutoCompleteWidget from "./AutoCompleteWidget"; // Ensure this path is correct

const UnitValueField = ({ formData, onChange, schema, uiSchema }: WidgetProps) => {
    const { value, unit } = formData || { value: '', unit: '' };

    const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...formData, value: event.target.value });
    };

    const handleUnitChange = (selectedUnit: any) => {
        // Update unit value using the AutoCompleteWidget's onChange handler
        onChange({ ...formData, unit: selectedUnit?.conceptId || "" }); // Update formData with the unit conceptId
    };

    // Get title from uiSchema (with fallback if title is not provided)
    const title = uiSchema?.["ui:title"] || "Unit and Value";

    // Get only the 'unit' specific options from the uiSchema
    const unitOptions = uiSchema?.unit?.["ui:options"] || {};

    return (
        <Grid container spacing={1}>
            {/* Title from uiSchema */}
            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                    {title}
                </Typography>
            </Grid>

            {/* Value field (e.g., number input) */}
            <Grid item xs={6}>
                <TextField
                    label="Value"
                    value={value || ''}
                    onChange={handleValueChange}
                    fullWidth // Makes the TextField take full width inside the Grid item
                />
            </Grid>

            {/* Unit field with AutoCompleteWidget */}
            <Grid item xs={6}>
                <AutoCompleteWidget
                    schema={schema} // Pass schema for AutoCompleteWidget
                    formData={unit || ''} // Make sure the correct unit data is passed
                    onChange={handleUnitChange} // Handle changes for unit
                    uiSchema={{
                        "ui:options": unitOptions, // Pass only the relevant 'unit' options
                    }}
                    fullWidth // Makes the AutoCompleteWidget take full width inside the Grid item
                />
            </Grid>
        </Grid>
    );
};

export default UnitValueField;
