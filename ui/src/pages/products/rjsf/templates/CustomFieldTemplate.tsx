import { FieldProps } from "@rjsf/core";
import { Box, FormHelperText, Typography } from "@mui/material";
import React from "react";

const CustomFieldTemplate = ({
                                 id,
                                 classNames,
                                 label,
                                 help,
                                 required,
                                 rawErrors,
                                 description,
                                 children,
                                 schema,
                                 uiSchema,
                             }: FieldProps) => {
    const errorMessage = rawErrors && rawErrors[0] ? rawErrors[0] : "";

    return (
        <Box className={classNames}>
            {/* Field label and description */}
            <div>
                {label && (
                    <Typography variant="h6" gutterBottom>
                        {label}
                        {required && <span style={{ color: "red" }}>*</span>}
                    </Typography>
                )}
            </div>

            {/* Render the children with errors passed as a prop */}
            {React.cloneElement(children, { rawErrors })}

            {/* Display error message if present */}
            {errorMessage && <FormHelperText error>{errorMessage}</FormHelperText>}
        </Box>
    );
};
export default CustomFieldTemplate;