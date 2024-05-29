import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import React, { FC, useEffect, useState } from 'react';
import { Concept } from '../../../types/concept.ts';
import useDebounce from '../../../hooks/useDebounce.tsx';

import { useSearchConceptsByEcl } from '../../../hooks/api/useInitializeConcepts.tsx';

import { Control, Controller, FieldError } from 'react-hook-form';
import { filterOptionsForConceptAutocomplete } from '../../../utils/helpers/conceptUtils.ts';
import { ConceptSearchResult } from './SearchProduct.tsx';

interface ProductAutocompleteV2Props {
  // eslint-disable-next-line
  control: Control<any>;
  optionValues?: Concept[];
  name: string;
  branch: string;
  ecl: string;
  dataTestId: string;
  showDefaultOptions?: boolean;
  error?: FieldError;
  readOnly?: boolean;
  handleChange?: (concept: Concept | null) => void;
}
const ProductAutocompleteV2: FC<ProductAutocompleteV2Props> = ({
  control,
  optionValues,
  name,
  branch,
  ecl,
  showDefaultOptions,
  error,
  readOnly,
  handleChange,
  dataTestId,
}) => {
  const [inputValue, setInputValue] = useState('');
  const debouncedSearch = useDebounce(inputValue, 1000);
  const [options, setOptions] = useState<ConceptSearchResult[]>(
    optionValues ? mapDefaultOptionsToConceptSearchResult(optionValues) : [],
  );
  const { isLoading, allData, isFetching, isOntoFetching } = useSearchConceptsByEcl(
    debouncedSearch,
    ecl,
    branch,
    showDefaultOptions && !optionValues && inputValue.length === 0
      ? true
      : false,
  );

  const [open, setOpen] = useState(false);
  useEffect(() => {
    mapDataToOptions();
  }, [allData]);

  const mapDataToOptions = () => {
    if (allData) {
      setOptions(allData);
    } else if (optionValues) {
      setOptions(mapDefaultOptionsToConceptSearchResult(optionValues));
    }
  };
  return (
    <Controller
      name={name as 'productName'}
      control={control}
      render={({ field: { onChange, value, onBlur }, ...props }) => (
        <Autocomplete
        // sx={{backgroundColor: 'red'}}
          loading={isLoading}
          data-testid={dataTestId}
          disableClearable={readOnly}
          options={options}
          fullWidth
          filterOptions={filterOptionsForConceptAutocomplete}
          getOptionLabel={option => option.pt?.term as string}
          renderInput={params => (
            <TextField
              {...params}
              error={!!error}
              helperText={error?.message ? error?.message : ' '}
              data-testid={`${dataTestId}-input`}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {/* So we can show two different loadings, one for onto, one for snowstorm */}
                    {isOntoFetching ? (
                      <CircularProgress color="success" size={20} />
                    ) : null}
                    {isFetching ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          onOpen={() => {
            if (inputValue) {
              setOpen(true);
            }
          }}
          onInputChange={(e, value) => {
            setInputValue(value);
            if (!value) {
              setOpen(false);
            }
          }}
          onBlur={onBlur}
          inputValue={inputValue}
          onChange={(e, data) => {
            // if (handleChange) {
            //   handleChange(data);
            // }
            onChange(data);
          }}
          {...props}
          value={value as ConceptSearchResult}
          groupBy={option => option.type}
          isOptionEqualToValue={(option, value) => {
            return option.conceptId === value.conceptId;
          }}
          
        />
      )}
    />
  );
};
export const mapDefaultOptionsToConceptSearchResult = (optionValues: Concept[]) => {
  return optionValues.map(option => {
    return {data: option, type: "DefaultOption"};
  })
}
export default ProductAutocompleteV2;
