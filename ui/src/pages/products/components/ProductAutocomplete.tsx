import { Autocomplete, TextField } from '@mui/material';
import React, { FC } from 'react';
import { Concept } from '../../../types/concept.ts';
import { FieldProps } from 'formik';
interface ProductAutocompleteProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setval: (val: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  optionValues: any[];
}
const ProductAutocomplete: FC<ProductAutocompleteProps & FieldProps> = ({
  field,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  form: { touched, setTouched, setFieldValue },
  setval,
  optionValues,

  ...props
}) => {
  const { name } = field;
  return (
    <Autocomplete
      {...props}
      {...field}
      onChange={(_, value) => {
        void setFieldValue(name, value);
        if (setval) {
          setval(value as Concept);
        }
      }}
      options={optionValues}
      onBlur={() => void setTouched({ [name]: true })}
      renderInput={props => (
        // <div {...props}></div>
        <TextField {...props} />
      )}
    />
  );
};
export default ProductAutocomplete;
