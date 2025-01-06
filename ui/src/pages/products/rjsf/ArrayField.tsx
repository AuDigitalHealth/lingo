import React from 'react';
import { ArrayFieldTemplateProps } from '@rjsf/core';
import { Box } from '@mui/material';

const CustomArrayField = ({ items, onAddClick }: ArrayFieldTemplateProps) => (
    <Box
        sx={{
            border: '1px solid #ddd',
            padding: '10px',
            marginBottom: '20px',
            borderRadius: '8px',
        }}
    >
        {items && items.length > 0 ? (
            items.map((item, index) => (
                <Box key={index} sx={{ marginBottom: '10px' }}>
                    {item.children}
                </Box>
            ))
        ) : (
            <p>No products added yet.</p>
        )}

        <button type="button" onClick={onAddClick}>
            Add Product
        </button>
    </Box>
);

export default CustomArrayField;
