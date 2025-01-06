import React, { useState, useEffect } from "react";
import { FieldProps } from "@rjsf/core";
import { Autocomplete, CircularProgress, TextField, Typography } from "@mui/material";
import { useSearchConceptsByEcl } from "../../../hooks/api/useInitializeConcepts";
import { Concept } from "../../../types/concept";

const AutoCompleteField = ({
                               schema,
                               uiSchema,
                               formData,
                               onChange,
                           }: FieldProps) => {
    const { branch, ecl, showDefaultOptions } = uiSchema["ui:options"] || {};
    const [inputValue, setInputValue] = useState(""); // The input field text value
    const [options, setOptions] = useState<Concept[]>([]); // The list of search results
    const { isLoading, allData } = useSearchConceptsByEcl(inputValue, ecl, branch, showDefaultOptions);

    // Extract title from the schema or uiSchema
    const title = schema.title || uiSchema["ui:title"];

    // Update options when search results change
    useEffect(() => {
        if (allData) {
            const uniqueOptions = Array.from(
                new Map(allData.map((item) => [item.conceptId, item])).values()
            );
            setOptions(uniqueOptions);
        }
    }, [allData]);

    // Handle product selection
    const handleProductChange = (selectedProduct: Concept | null) => {
        if (selectedProduct) {
            onChange(selectedProduct.conceptId); // Update the formData with the selected concept ID
            setInputValue(selectedProduct.pt.term); // Set the input value to the selected term
        } else {
            onChange(null); // Clear the formData if no selection is made
            setInputValue(""); // Clear the input field
        }
    };

    // Initialize the input value when formData changes
    useEffect(() => {
        if (formData) {
            const selectedOption = options.find((option) => option.conceptId === formData);
            if (selectedOption) {
                setInputValue(selectedOption.pt.term); // Sync the input value with the selected term
            }
        }
    }, [formData, options]);

    return (
        <div>
            {/* Render the title */}
            {title && <Typography variant="h6" gutterBottom>{title}</Typography>}

            {/* Autocomplete field */}
            <Autocomplete
                loading={isLoading}
                options={options}
                getOptionLabel={(option) => option?.pt?.term || ""} // Display the term as the label
                value={options.find((option) => option.conceptId === formData) || null} // Match selected value
                onInputChange={(event, newInputValue) => setInputValue(newInputValue)} // Update input text
                onChange={(event, selectedValue) => handleProductChange(selectedValue as Concept)} // Update selected value
                isOptionEqualToValue={(option, selectedValue) =>
                    option?.conceptId === selectedValue?.conceptId // Match based on conceptId
                }
                renderOption={(props, option) => (
                    <li {...props} key={option.conceptId}>
                        {option.pt.term} {/* Render the term */}
                    </li>
                )}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={schema.title}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {isLoading ? <CircularProgress size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                    />
                )}
            />
        </div>
    );
};

export default AutoCompleteField;
