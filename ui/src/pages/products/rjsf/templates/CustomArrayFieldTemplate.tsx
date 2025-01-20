import React from "react";
import { ArrayFieldTemplateProps } from "@rjsf/core";
import { Box, Button, Typography, Card, CardContent, Stack, FormHelperText } from "@mui/material";

const CustomArrayFieldTemplate = ({
                                      items,
                                      canAdd,
                                      onAddClick,
                                      schema,
                                      uiSchema,
                                      rawErrors,
                                      required,
                                      idSchema,
                                      description,
                                  }: ArrayFieldTemplateProps) => {
    const errorMessage = rawErrors && rawErrors[0] ? rawErrors[0] : '';

    // Determine the title based on the first field name
    const firstFieldName =
        schema.items && schema.items.properties
            ? Object.keys(schema.items.properties)[0]
            : null;

    const dynamicTitle = firstFieldName
        ? schema.items.properties[firstFieldName]?.title || firstFieldName
        : 'Items';

    return (
        <Box>
            {/* Dynamic Title */}
            <Typography variant="h6" gutterBottom>
                {dynamicTitle}
                {required && <span style={{ color: "red" }}> *</span>}
            </Typography>

            {/* Description */}
            {description && (
                <Typography variant="body2" color="textSecondary" gutterBottom>
                    {description}
                </Typography>
            )}

            {/* Render each array item */}
            <Stack spacing={2}>
                {items.map((element) => (
                    <Card key={element.index} variant="outlined">
                        <CardContent>
                            {/* Render the item */}
                            <div>{element.children}</div>

                            {/* Default Remove button */}
                            {element.hasRemove && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={element.onDropIndexClick(element.index)}
                                    style={{ marginTop: "8px" }}
                                >
                                    Remove
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </Stack>

            {/* Add button */}
            {canAdd && (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={onAddClick}
                    style={{ marginTop: "16px" }}
                >
                    Add Item
                </Button>
            )}

            {/* Display error message if present */}
            {errorMessage && (
                <FormHelperText error style={{ marginTop: "8px" }}>
                    {errorMessage}
                </FormHelperText>
            )}
        </Box>
    );
};

export default CustomArrayFieldTemplate;
