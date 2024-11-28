import { Product, ProductSummary } from '../../../types/concept.ts';
import {
  Control,
  Controller,
  UseFormGetValues,
  UseFormRegister,
} from 'react-hook-form';
import { FormHelperText, Grid, TextField } from '@mui/material';
import { InnerBoxSmall } from './style/ProductBoxes.tsx';
import {
  filterKeypress,
  setEmptyToNull,
} from '../../../utils/helpers/conceptUtils.ts';
import React, { useState } from 'react';

interface NewConceptDropdownProps {
  product: Product;
  index: number;
  register: UseFormRegister<ProductSummary>;
  getValues: UseFormGetValues<ProductSummary>;
  control: Control<ProductSummary>;
}

function NewConceptDropdown({
  product,
  index,
  register,
  getValues,
  control,
}: NewConceptDropdownProps) {
  return (
    <div key={'div-' + product.conceptId}>
      <Grid item xs={12}>
        <Grid item xs={12}>
          <NewConceptDropdownField
            fieldName={`nodes[${index}].newConceptDetails.fullySpecifiedName`}
            originalValue={
              product.newConceptDetails?.fullySpecifiedName as string
            }
            register={register}
            legend={'FSN'}
            getValues={getValues}
            dataTestId={`fsn-input`}
            control={control}
          />
        </Grid>
        <NewConceptDropdownField
          fieldName={`nodes[${index}].newConceptDetails.preferredTerm`}
          originalValue={product.newConceptDetails?.preferredTerm as string}
          register={register}
          legend={'Preferred Term'}
          getValues={getValues}
          dataTestId={`pt-input`}
          control={control}
        />
        <InnerBoxSmall component="fieldset">
          <legend>Specified Concept Id</legend>
          <TextField
            {...register(
              `nodes[${index}].newConceptDetails.specifiedConceptId` as 'nodes.0.newConceptDetails.specifiedConceptId',
              { required: false, setValueAs: setEmptyToNull },
            )}
            fullWidth
            variant="outlined"
            margin="dense"
            InputLabelProps={{ shrink: true }}
            onKeyDown={filterKeypress}
          />
        </InnerBoxSmall>
        {product.label === 'CTPP' && (
          <InnerBoxSmall component="fieldset">
            <legend>Artg Ids</legend>
            <TextField
              fullWidth
              value={product.newConceptDetails?.referenceSetMembers
                .flatMap(r => r.additionalFields?.mapTarget)
                .sort((a, b) => {
                  if (a !== undefined && b !== undefined) {
                    return +a - +b;
                  }
                  return 0;
                })}
              InputProps={{
                readOnly: true,
              }}
            />
          </InnerBoxSmall>
        )}
      </Grid>
    </div>
  );
}

interface NewConceptDropdownFieldProps {
  register: UseFormRegister<ProductSummary>;
  originalValue: string;
  fieldName: string;
  legend: string;
  getValues: UseFormGetValues<ProductSummary>;
  dataTestId: string;
  control: Control<ProductSummary>;
}

function NewConceptDropdownField({
  fieldName,
  legend,
  getValues,
  dataTestId,
  control,
}: NewConceptDropdownFieldProps) {
  const [fieldChanged, setFieldChange] = useState(false);

  const handleBlur = () => {
    const currentVal: string = getValues(
      fieldName as 'nodes.0.newConceptDetails.preferredTerm',
    );
    const preferredFieldName = fieldName.replace(
      /\.(\w+)$/,
      (match, p1: string) =>
        `.generated${p1.charAt(0).toUpperCase() + p1.slice(1)}`,
    );
    const generatedVal: string = getValues(
      preferredFieldName as 'nodes.0.newConceptDetails.preferredTerm',
    );
    setFieldChange(!(currentVal === generatedVal));
  };

  return (
    <InnerBoxSmall component="fieldset">
      <legend>{legend}</legend>

      <Controller
        name={fieldName as 'nodes.0.newConceptDetails.preferredTerm'}
        control={control}
        defaultValue=""
        render={({ field }) => (
          <TextField
            {...field}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            margin="dense"
            fullWidth
            multiline
            minRows={1}
            maxRows={4}
            data-testid={dataTestId}
            color={fieldChanged ? 'error' : 'primary'}
            onBlur={handleBlur}
          />
        )}
      />
      {fieldChanged && (
        <FormHelperText sx={{ color: t => `${t.palette.warning.main}` }}>
          This name has been changed from the auto-generated name.
        </FormHelperText>
      )}
    </InnerBoxSmall>
  );
}
export default NewConceptDropdown;
