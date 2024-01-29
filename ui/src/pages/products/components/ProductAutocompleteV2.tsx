import { Autocomplete, TextField } from '@mui/material';
import React, { FC, useEffect, useState } from 'react';
import { Concept } from '../../../types/concept.ts';
import useDebounce from '../../../hooks/useDebounce.tsx';

import { useSearchConceptsByEcl } from '../../../hooks/api/useInitializeConcepts.tsx';

import { Control, Controller, FieldError } from 'react-hook-form';
import { filterOptionsForConceptAutocomplete } from '../../../utils/helpers/conceptUtils.ts';

interface ProductAutocompleteV2Props {
  // eslint-disable-next-line
  control: Control<any>;
  optionValues?: Concept[];
  name: string;
  branch: string;
  ecl: string;
  showDefaultOptions?: boolean;
  error?: FieldError;
  readOnly?: boolean;
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
}) => {
  const [inputValue, setInputValue] = useState('');
  const debouncedSearch = useDebounce(inputValue, 1000);
  const [options, setOptions] = useState<Concept[]>(
    optionValues ? optionValues : [],
  );
  const { isLoading, data } = useSearchConceptsByEcl(
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
  }, [data]);

  const mapDataToOptions = () => {
    if (data) {
      setOptions(data);
    } else if (optionValues) {
      setOptions(optionValues);
    }
  };
  return (
    <Controller
      name={name as 'productName'}
      control={control}
      render={({ field: { onChange, value }, ...props }) => (
        <Autocomplete
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
          inputValue={inputValue}
          onChange={(e, data) => onChange(data)}
          {...props}
          value={(value as Concept) || null}
          isOptionEqualToValue={(option, value) => {
            return option.conceptId === value.conceptId;
          }}
        />
      )}
    />
  );
};
export default ProductAutocompleteV2;
