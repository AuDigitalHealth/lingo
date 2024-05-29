import { Autocomplete, TextField } from '@mui/material';
import React, { FC, useEffect, useState } from 'react';
import { Concept } from '../../../types/concept.ts';
import useDebounce from '../../../hooks/useDebounce.tsx';

import { useSearchConceptsByEcl } from '../../../hooks/api/useInitializeConcepts.tsx';

import { Control, Controller, FieldError } from 'react-hook-form';
import { filterOptionsForConceptAutocomplete } from '../../../utils/helpers/conceptUtils.ts';
import { ConceptSearchResult } from './SearchProduct.tsx';
import { mapDefaultOptionsToConceptSearchResult } from './ProductAutocompleteV2.tsx';

interface ProductAutocompleteMultiSelectProps {
  // eslint-disable-next-line
  control: Control<any>;
  optionValues?: Concept[];
  name: string;
  branch: string;
  ecl: string;
  showDefaultOptions?: boolean;
  error?: FieldError;
  readOnly?: boolean;
  maxHeightProvided?: number;
  disabled?: boolean;
}
const ProductAutocompleteMultiSelect: FC<
  ProductAutocompleteMultiSelectProps
> = ({
  control,
  optionValues,
  name,
  branch,
  ecl,
  showDefaultOptions,
  error,
  readOnly,
  maxHeightProvided,
  disabled,
}) => {
  const [inputValue, setInputValue] = useState('');
  const debouncedSearch = useDebounce(inputValue, 1000);
  const [options, setOptions] = useState<ConceptSearchResult[]>(
    optionValues ? mapDefaultOptionsToConceptSearchResult(optionValues) : [],
  );
  const { isLoading, data, allData } = useSearchConceptsByEcl(
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
        sx={{backgroundColor: 'red'}}
          multiple={true}
          disabled={disabled}
          loading={isLoading}
          disableClearable={readOnly}
          options={options.sort((a, b) => {
            return b.pt && a.pt ? -b.pt?.term.localeCompare(a.pt?.term) : -1;
          })}
          fullWidth
          filterOptions={filterOptionsForConceptAutocomplete}
          getOptionLabel={option => option.pt?.term as string}
          renderInput={params => (
            <TextField
              {...params}
              error={!!error}
              helperText={error?.message ? error?.message : ' '}
              style={{
                maxHeight: maxHeightProvided ? maxHeightProvided : 150,
                overflow: 'auto',
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
            onChange(data);
          }}
          {...props}
          value={value ? (value as ConceptSearchResult[]) : undefined}
          isOptionEqualToValue={(option, value) => {
            return option.conceptId === value.conceptId;
          }}
        />
      )}
    />
  );
};
export default ProductAutocompleteMultiSelect;
