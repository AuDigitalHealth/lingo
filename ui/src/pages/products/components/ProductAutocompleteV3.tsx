import { Autocomplete, TextField } from '@mui/material';
import React, { FC, useEffect, useState } from 'react';
import { Concept } from '../../../types/concept.ts';
import useDebounce from '../../../hooks/useDebounce.tsx';

import { useSearchConceptsByEcl } from '../../../hooks/api/useInitializeConcepts.tsx';

import { Control, Controller, FieldError } from 'react-hook-form';
interface ProductAutocompleteV3Props {
  // eslint-disable-next-line
  control: Control<any>;
  optionValues?: Concept[];
  name: string;
  branch: string;
  ecl: string;
  showDefaultOptions?: boolean;
  error?: FieldError;
  freeSolo: boolean;
}
const ProductAutocompleteV3: FC<ProductAutocompleteV3Props> = ({
  control,
  optionValues,
  name,
  branch,
  ecl,
  showDefaultOptions,
  error,
  freeSolo,
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
          freeSolo={freeSolo}
          autoSelect={true}
          loading={isLoading}
          options={options.sort((a, b) => {
            return b.pt && a.pt ? -b.pt?.term.localeCompare(a.pt?.term) : -1;
          })}
          fullWidth
          getOptionLabel={(option: Concept | string) => {
            if (typeof option === 'string') {
              return option;
            } else {
              return option.pt?.term as string;
            }
          }}
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
          onChange={(e, value: Concept | null | string, reason) => {
            if (typeof value === 'string') {
              if (reason === 'createOption' || reason === 'selectOption') {
                const concept: Concept = {
                  pt: {
                    term: value,
                  },
                };
                value = concept;
                return onChange(value);
              } else {
                return;
              }
            }
            return onChange(value);
          }}
          {...props}
          value={(value as Concept) || null}
          // value={(value as any[]) || []}
        />
      )}
    />
  );
};
export default ProductAutocompleteV3;
