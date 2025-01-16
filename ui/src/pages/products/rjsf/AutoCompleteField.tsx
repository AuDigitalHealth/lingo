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
        ecl  && ecl.length > 0 ? ecl:undefined,
        branch,
        showDefaultOptions,
    );

    const title = schema.title || uiSchema['ui:title'];
    const isRequired = uiSchema['ui:required'] || schema?.title?.includes('*');
    const isDisabled = uiSchema['ui:options']?.disabled || false;

    let errorMessage = '';

    // Fallback to rawErrors message if schema errorMessage doesn't provide one
    if (rawErrors && rawErrors[0]) {
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
            setInputValue(formData?.pt?.term || '');
        }
    }, [formData, options]);

    // Handle option selection
    const handleProductChange = (selectedProduct: Concept | null) => {
        if (selectedProduct) {
            const conceptMini: ConceptMini = { conceptId: selectedProduct.conceptId || '' };
            onChange(conceptMini);
            setInputValue(selectedProduct.pt.term);
        } else {
            onChange(null);
            setInputValue('');
        }
    };

    // Clear value and disable options when field is disabled
    useEffect(() => {
        if (isDisabled) {
            handleProductChange(null); // Clear selected value
        }
    }, [isDisabled]);

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
                options={isDisabled ? [] : options} // Show no options when disabled
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
                        error={!!errorMessage}
                        helperText={errorMessage}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {isLoading ? <CircularProgress size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                        disabled={isDisabled} // Disable input
                    />
                )}
            />
        </Box>
    );
};

export default AutoCompleteField;
