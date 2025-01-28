import { FieldProps } from '@rjsf/core';
import { Box, FormHelperText, Typography } from '@mui/material';
import React from 'react';

const CustomFieldTemplate = (props: FieldProps) => {
    const {
        id,
        classNames,
        label,
        required,
        rawErrors,
        description,
        children,
        schema,
        uiSchema,
        formContext,
    } = props;

    const errorMessage = rawErrors && rawErrors[0] ? rawErrors[0] : '';

    // Check if this field is already processed by ArrayFieldTemplate
    const skipTitle = uiSchema['ui:options']?.skipTitle;

    return (
        <Box className={classNames} sx={{ width: '100%' }}>
            {/* Skip rendering title and description if already processed */}
            {!skipTitle && (
                <div>
                    {label && (
                        <Typography variant="h6" gutterBottom>
                            {label}
                            {required && <span style={{ color: 'red' }}>*</span>}
                        </Typography>
                    )}
                    {description && <div className="field-description">{description}</div>}
                </div>
            )}

            {/* Render children */}
            {React.cloneElement(children, { rawErrors })}

            {/* Render validation error */}
            {errorMessage && <FormHelperText error>{errorMessage}</FormHelperText>}
        </Box>
    );
};

export default CustomFieldTemplate;
