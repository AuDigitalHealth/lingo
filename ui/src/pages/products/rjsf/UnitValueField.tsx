import React from 'react';
import { Grid, TextField, Typography } from '@mui/material';
import AutoCompleteField from "./AutoCompleteField"; // Ensure this path is correct
import { FieldProps } from '@rjsf/core';

const UnitValueField = ({ formData, onChange, schema, uiSchema }: FieldProps) => {
    const { value, unit } = formData || { value: '', unit: '' };

    const handleUnitChange = (selectedUnit: string | null) => {
        // Update unit value using the AutoCompleteField's onChange handler
        onChange({ ...formData, unit: selectedUnit || "" }); // Update formData with the unit conceptId
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
                    onChange={(event) => {
                        const numericValue = parseFloat(event.target.value);
                        if (!isNaN(numericValue)) {
                            onChange({ ...formData, value: numericValue });
                        }
                    }}
                    type="number"
                    fullWidth={true}
                />

            </Grid>

            {/* Unit field with AutoCompleteField */}
            <Grid item xs={6}>
                <AutoCompleteField
                    schema={schema} // Pass schema for AutoCompleteField
                    formData={unit || ''} // Pass the current unit value
                    onChange={handleUnitChange} // Handle changes for unit
                    uiSchema={{
                        "ui:options": unitOptions, // Pass only the relevant 'unit' options
                    }}
                />
            </Grid>
        </Grid>
    );
};

export default UnitValueField;
