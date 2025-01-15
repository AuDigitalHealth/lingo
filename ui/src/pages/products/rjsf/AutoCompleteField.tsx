import React, { useState, useEffect } from 'react';
import { FieldProps } from '@rjsf/core';
import {
    Autocomplete,
    CircularProgress,
    TextField,
    Typography,
    Box,
    FormHelperText,
} from '@mui/material';
import { useSearchConceptsByEcl } from '../../../hooks/api/useInitializeConcepts';
import { Concept, ConceptMini } from '../../../types/concept';

const AutoCompleteField = ({
                               schema,
                               uiSchema,
                               formData,
                               onChange,
                               rawErrors, // Access rawErrors to get validation errors
                           }: FieldProps) => {
    const { branch, ecl, showDefaultOptions } = uiSchema['ui:options'] || {};
    const [inputValue, setInputValue] = useState('');
    const [options, setOptions] = useState<Concept[]>([]);
    const { isLoading, allData } = useSearchConceptsByEcl(
        inputValue,
        ecl,
        branch,
        showDefaultOptions,
    );

    const title = schema.title || uiSchema['ui:title'];
    const isRequired = uiSchema['ui:required'] || schema?.title?.includes('*');
    const isDisabled = uiSchema['ui:options']?.disabled || false;

    let errorMessage = '';

    // Fallback to rawErrors message if schema errorMessage doesn't provide one
    if ( rawErrors && rawErrors[0]) {
        errorMessage = rawErrors[0].message || '';
    }

    // Update options when search results change
    useEffect(() => {
        if (allData) {
            const uniqueOptions = Array.from(
                new Map(allData.map(item => [item.conceptId, item])).values(),
            );
            setOptions(uniqueOptions);
        }
    }, [allData]);

    // Sync inputValue and selected option when formData or options change
    useEffect(() => {
        if (formData && options.length > 0) {
            const selectedOption = options.find(
                option => option.conceptId === formData.conceptId,
            );
            setInputValue(selectedOption?.pt.term || formData?.pt?.term || '');
        } else if (formData) {
            // If options are not yet loaded, fallback to formData value
            setInputValue(formData?.pt?.term || '');
        }
    }, [formData, options]);

    // Handle option selection
    const handleProductChange = (selectedProduct: Concept | null) => {
        if (selectedProduct) {
            const conceptMini: ConceptMini = { conceptId: selectedProduct.conceptId || '' };
            onChange(conceptMini); // Update formData
            setInputValue(selectedProduct.pt.term); // Set input text
        } else {
            onChange(null); // Clear formData
            setInputValue(''); // Clear input field
        }
    };

    return (
        <Box>
            {title && (
                <Typography variant="h6" gutterBottom>
                    {title}
                    {isRequired && <span style={{ color: 'red' }}>*</span>}
                </Typography>
            )}

            <Autocomplete
                loading={isLoading}
                options={options}
                getOptionLabel={option => option?.pt?.term || ''}
                value={
                    options.find(option => option.conceptId === formData?.conceptId) ||
                    formData ||
                    null
                }
                onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
                onChange={(event, selectedValue) =>
                    handleProductChange(selectedValue as Concept)
                }
                isOptionEqualToValue={(option, selectedValue) =>
                    option?.conceptId === selectedValue?.conceptId
                }
                renderOption={(props, option) => (
                    <li {...props} key={option.conceptId}>
                        {option.pt.term}
                    </li>
                )}
                renderInput={params => (
                    <TextField
                        {...params}
                        label={title}
                        error={!!errorMessage} // Highlights the field in red if there are errors
                        helperText={errorMessage} // Displays the error message
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {isLoading ? <CircularProgress size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                        disabled={isDisabled}
                    />
                )}
            />
        </Box>
    );
};

export default AutoCompleteField;
