import React, { useState } from "react";
import { Chip, IconButton, Box, Typography, TextField } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

const ExternalIdentifierWidget = ({ value = [], onChange, schema, uiSchema }) => {
    const defaultScheme =
        schema?.items?.properties?.identifierScheme?.default || // Get from schema default
        uiSchema?.["ui:options"]?.defaultScheme || // Get from uiSchema if defined
        "";

    const [inputValue, setInputValue] = useState("");

    const handleAdd = () => {
        if (inputValue.trim()) {
            const newValue = [
                ...value,
                { identifierScheme: defaultScheme, identifierValue: inputValue.trim() },
            ];
            onChange(newValue);
            setInputValue("");
        }
    };

    const handleRemove = (index) => {
        const newValue = value.filter((_, i) => i !== index);
        onChange(newValue);
    };

    return (
        <Box sx={{ border: "1px solid #ddd", padding: "16px", borderRadius: "8px" }}>
            {/* Wrapper for adding new identifier value and listing */}
            <Box mb={2}>
                {/* Input for adding new identifier values */}
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <TextField
                        label="Identifier Value"
                        variant="outlined"
                        size="small"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        fullWidth
                    />
                    <IconButton onClick={handleAdd} color="primary">
                        <AddCircleOutlineIcon />
                    </IconButton>
                </Box>

                {/* Render list of identifier values as Chips */}
                {value.length > 0 && (
                    <Box mb={2}>
                        <Typography variant="subtitle1" gutterBottom>
                            Identifier List:
                        </Typography>
                        <Box display="flex" gap={1} flexWrap="wrap">
                            {value.map((item, index) => (
                                <Chip
                                    key={index}
                                    label={item.identifierValue}
                                    onDelete={() => handleRemove(index)}
                                    deleteIcon={<RemoveCircleOutlineIcon />}
                                    sx={{
                                        backgroundColor: "#f0f0f0",
                                        fontSize: "0.875rem",
                                        color: "#333",
                                        borderRadius: "16px",
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default ExternalIdentifierWidget;
