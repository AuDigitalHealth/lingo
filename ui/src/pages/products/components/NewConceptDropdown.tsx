import { Product, ProductSummary } from '../../../types/concept.ts';
import {
  Control,
  Controller,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue
} from 'react-hook-form';
import { FormControlLabel, FormHelperText, Grid, Stack, Switch, TextField } from '@mui/material';
import { InnerBoxSmall } from './style/ProductBoxes.tsx';
import { filterKeypress, setEmptyToNull } from '../../../utils/helpers/conceptUtils.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';
import { replaceAllWithWhiteSpace } from '../../../types/productValidationUtils.ts';
import { convertStringToRegex } from '../../../utils/helpers/stringUtils.ts';
import { getValueFromFieldBindings } from '../../../utils/helpers/FieldBindingUtils.ts';
import React, { useRef, useState } from 'react';
import AdditionalPropertiesDisplay from './AdditionalPropertiesDisplay.tsx';
import { ProductRetireUpdate } from './ProductRetireUpdate.tsx';

interface NewConceptDropdownProps {
  product: Product;
  index: number;
  register: UseFormRegister<ProductSummary>;
  getValues: UseFormGetValues<ProductSummary>;
  control: Control<ProductSummary>;
  fieldBindings: FieldBindings;
  branch: string;
  setValue?: UseFormSetValue<ProductSummary>;
}

function NewConceptDropdown({
  product,
  index,
  register,
  getValues,
  control,
  fieldBindings,
  branch,
  setValue,
}: NewConceptDropdownProps) {
  const initialStatusRef = useRef(product.newConceptDetails?.axioms[0].definitionStatus ?? 'PRIMITIVE');
  const [currentStatus, setCurrentStatus] = useState(initialStatusRef.current);
  return (
    <div key={'div-' + product.conceptId}>
      <Grid item xs={12}>
        <Grid item xs={12}>
          <Controller
            name={`nodes[${index}].newConceptDetails.axioms.0.definitionStatus` as const}
            control={control}
            render={({ field }) => (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value === 'FULLY_DEFINED'}
                      onChange={(_, checked: boolean) => {
                        const status = checked ? 'FULLY_DEFINED' : 'PRIMITIVE';
                        field.onChange(status);
                        setCurrentStatus(status);
                        setValue?.(
                          `nodes.${index}.newConceptDetails.axioms.0.definitionStatusId`,
                          checked ? '900000000000073002' : '900000000000074008'
                        );
                      }}
                      color="primary"
                    />
                  }
                  label={field.value === 'FULLY_DEFINED' ? 'Fully Defined' : 'Primitive'}
                />
                {currentStatus !== initialStatusRef.current && (
                  <FormHelperText sx={{ color: t => `${t.palette.warning.main}` }}>
                    Warning: You have changed the definition status from its calculated value.
                  </FormHelperText>
                )}
              </>
            )}
          />
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
            fieldBindings={fieldBindings}
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
          fieldBindings={fieldBindings}
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
        {setValue && (
          <ProductRetireUpdate
            product={product}
            control={control}
            index={index}
            setValue={setValue}
            branch={branch}
          />
        )}

        <AdditionalPropertiesDisplay product={product} branch={branch} />
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
  fieldBindings: FieldBindings;
}

function NewConceptDropdownField({
  fieldName,
  legend,
  getValues,
  dataTestId,
  control,
  fieldBindings,
}: NewConceptDropdownFieldProps) {
  const [fieldChanged, setFieldChange] = useState(false);

  const regExp = convertStringToRegex(
    getValueFromFieldBindings(fieldBindings, 'description.validation'),
  );
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
          <Stack sx={{ alignItems: 'center', flexDirection: 'row' }}>
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
              onChange={e => {
                const value =
                  regExp !== null
                    ? replaceAllWithWhiteSpace(
                        regExp,

                        e.target.value,
                      )
                    : e.target.value;

                field.onChange(value);
              }}
              color={fieldChanged ? 'error' : 'primary'}
              onBlur={handleBlur}
            />
          </Stack>
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
