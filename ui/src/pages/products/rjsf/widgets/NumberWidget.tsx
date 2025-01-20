import React from 'react';
import TextField from '@mui/material/TextField';

const NumberWidget = ({ value, onChange, required, disabled, readonly, label, schema }) => {
    return (
        <TextField
            type="number"
            label={label || schema.title}
            value={value || ''}
            onChange={(event) => {
                const val = event.target.value;
                onChange(val ? Number(val) : undefined);
            }}
            required={required}
            disabled={disabled || readonly}
            variant="outlined"
            fullWidth
        />
    );
};

export default NumberWidget;
