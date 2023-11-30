import { Autocomplete, TextField } from '@mui/material';
import React, { FC, useEffect, useState } from 'react';
import { Concept } from '../../../types/concept.ts';
import useDebounce from '../../../hooks/useDebounce.tsx';

import { useChildConceptSearchUsingEcl } from '../../../hooks/api/useInitializeConcepts.tsx';
import { Control, Controller } from 'react-hook-form';
import { filterOptionsForConceptAutocomplete } from '../../../utils/helpers/conceptUtils.ts';
interface ProductAutoCompleteChildProps {
  optionValues: Concept[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;

  name: string;
  inputValue: string;
  setInputValue: (val: string) => void;
  ecl: string | undefined;
  branch: string;
}
const ProductAutoCompleteChild: FC<ProductAutoCompleteChildProps> = ({
  optionValues,
  inputValue,
  setInputValue,
  control,
  name,
  ecl,
  branch,
}) => {
  const debouncedSearch = useDebounce(inputValue, 1000);
  const [options, setOptions] = useState<Concept[]>(
    optionValues ? optionValues : [],
  );
  const { data } = useChildConceptSearchUsingEcl(debouncedSearch, ecl, branch);
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
      name={name as 'containedProducts.0.productDetails.specificForm'}
      control={control}
      render={({ field: { onChange, value }, ...props }) => (
        <Autocomplete
          // loading={isLoading}
          options={options.sort((a, b) => -b.pt.term.localeCompare(a.pt.term))}
          filterOptions={filterOptionsForConceptAutocomplete}
          getOptionLabel={option => option.pt.term}
          renderInput={params => <TextField {...params} />}
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
          onChange={(e, data) => {
            onChange(data);
          }}
          {...props}
          value={inputValue === '' ? null : (value as Concept)}
        />
      )}
    />
  );
};
export default ProductAutoCompleteChild;
