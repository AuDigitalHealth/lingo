import React, { useState, useEffect } from "react";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import { useSearchConceptsByEcl } from "../../../hooks/api/useInitializeConcepts";

const ProductAutocompleteV3 = ({
                                   name,
                                   branch,
                                   ecl,
                                   value,
                                   onChange,
                                   showDefaultOptions,
                               }) => {
    const [inputValue, setInputValue] = useState("");
    const [options, setOptions] = useState([]);
    const { isLoading, allData } = useSearchConceptsByEcl(inputValue, ecl, branch, showDefaultOptions);

    useEffect(() => {
        if (allData) {
            setOptions(allData);
        }
    }, [allData]);

    return (
        <Autocomplete
            loading={isLoading}
            options={options}
            getOptionLabel={(option) => option?.pt?.term || ""}
            value={value || null} // The entire SnowstormConceptMini object
            onInputChange={(event, newValue) => setInputValue(newValue)}
            onChange={(event, selectedValue) => {
                onChange(selectedValue); // Pass the full SnowstormConceptMini object
            }}
            isOptionEqualToValue={(option, selectedValue) =>
                option?.conceptId === selectedValue?.conceptId
            }
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={name}
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
    );
};

export default ProductAutocompleteV3;
