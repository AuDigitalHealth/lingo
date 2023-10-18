import { Autocomplete, TextField } from '@mui/material';
import React, { FC } from 'react';
import { FieldProps } from 'formik';
import { ExternalIdentifier } from '../../../types/authoring.ts';
interface ArtgAutocompleteProps {
  setval: (val: any) => void;
  optionValues: any[];
}
const ArtgAutocomplete: FC<ArtgAutocompleteProps & FieldProps> = ({
  field,
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
      value={(field.value as ExternalIdentifier) || null}
      onChange={(_, values: any[]) => {
        const tempValues: ExternalIdentifier[] = [];
        values.map(v => {
          if (typeof v === 'string') {
            const artg: ExternalIdentifier = {
              identifierScheme: 'https://www.tga.gov.au/artg',
              identifierValue: v,
            };
            tempValues.push(artg);
          } else {
            tempValues.push(v as ExternalIdentifier);
          }
        });

        void setFieldValue(name, tempValues);
        if (setval) {
          setval(tempValues);
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
export default ArtgAutocomplete;
