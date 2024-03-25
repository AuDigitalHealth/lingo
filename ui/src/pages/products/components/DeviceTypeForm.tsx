import {
  FieldLabel,
  FieldLabelRequired,
  InnerBox,
  OuterBox,
} from './style/ProductBoxes.tsx';

import { Stack } from '@mui/system';
import { Grid, TextField } from '@mui/material';
import {
  Control,
  FieldError,
  FieldErrors,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form';
import { DevicePackageDetails } from '../../../types/product.ts';

import SpecificDeviceType from './SpecificDeviceType.tsx';
import ProductAutocompleteV2 from './ProductAutocompleteV2.tsx';
import { generateEclFromBinding } from '../../../utils/helpers/EclUtils.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';
import React, { useState } from 'react';
import { Concept } from '../../../types/concept.ts';

interface DeviceTypeFormsProps {
  productsArray: string;
  control: Control<DevicePackageDetails>;
  register: UseFormRegister<DevicePackageDetails>;

  index: number;
  branch: string;
  fieldBindings: FieldBindings;
  getValues: UseFormGetValues<DevicePackageDetails>;
  errors?: FieldErrors<DevicePackageDetails>;
  setValue: UseFormSetValue<any>;
}

export default function DeviceTypeForms(props: DeviceTypeFormsProps) {
  const {
    index,

    productsArray,
    control,
    register,

    branch,
    fieldBindings,
    getValues,
    errors,
    setValue,
  } = props;

  const packSizeError = errors?.containedProducts?.[index]?.value as FieldError;

  const packSizeUnitError = errors?.containedProducts?.[index]
    ?.unit as FieldError;

  const [selectedDeviceType, setSelectedDeviceType] = useState<Concept | null>(
    null,
  );

  const handleSelectedDeviceType = (concept: Concept | null) => {
    setSelectedDeviceType(concept);
    if (concept === null) {
      setValue(
        `${productsArray}[${index}].productDetails.specificDeviceType` as 'containedProducts.0.productDetails.specificDeviceType',
        null,
        { shouldDirty: false },
      );
    }
  };

  return (
    <Grid xs={6} key={'right'} item={true}>
      <OuterBox component="fieldset">
        <legend>Device Forms</legend>
        <InnerBox component="fieldset">
          <FieldLabelRequired>Device Type</FieldLabelRequired>
          <ProductAutocompleteV2
            name={`${productsArray}[${index}].productDetails.deviceType`}
            control={control}
            branch={branch}
            ecl={generateEclFromBinding(
              fieldBindings,
              'deviceProduct.deviceType',
            )}
            showDefaultOptions={false}
            error={
              errors?.containedProducts?.[index]?.productDetails
                ?.deviceType as FieldError
            }
            handleChange={handleSelectedDeviceType}
          />
        </InnerBox>
        <SpecificDeviceType
          index={index}
          control={control}
          branch={branch}
          productsArray={productsArray}
          fieldBindings={fieldBindings}
          getValues={getValues}
          register={register}
          selectedDeviceType={selectedDeviceType}
          setSelectedDeviceType={setSelectedDeviceType}
          setValue={setValue}
          errors={errors}
        />

        <InnerBox component="fieldset">
          <FieldLabelRequired>Pack Size</FieldLabelRequired>

          <Stack direction="row" spacing={2} alignItems={'center'}>
            <Grid item xs={4}>
              <TextField
                {...register(
                  `${productsArray}[${index}].value` as 'containedProducts.0.value',
                )}
                fullWidth
                variant="outlined"
                margin="dense"
                InputLabelProps={{ shrink: true }}
                error={!!packSizeError}
                helperText={
                  packSizeError?.message ? packSizeError?.message : ' '
                }
              />
            </Grid>
            <Grid item xs={8}>
              <ProductAutocompleteV2
                name={`${productsArray}[${index}].unit`}
                control={control}
                branch={branch}
                ecl={generateEclFromBinding(
                  fieldBindings,
                  'package.containedProduct.unit',
                )}
                showDefaultOptions={true}
                error={packSizeUnitError}
                //TODO update key
              />
            </Grid>
          </Stack>
        </InnerBox>

        <InnerBox component="fieldset">
          <FieldLabel>Other Identifying Information </FieldLabel>
          <Grid item xs={12}>
            <TextField
              {...register(
                `${productsArray}[${index}].productDetails.otherIdentifyingInformation` as 'containedProducts.0.productDetails.otherIdentifyingInformation',
              )}
              fullWidth
              variant="outlined"
              margin="dense"
              InputLabelProps={{ shrink: true }}
              error={
                !!errors?.containedProducts?.[index]?.productDetails
                  ?.otherIdentifyingInformation
              }
              helperText={
                errors?.containedProducts?.[index]?.productDetails
                  ?.otherIdentifyingInformation?.message
                  ? errors?.containedProducts?.[index]?.productDetails
                      ?.otherIdentifyingInformation?.message
                  : ' '
              }
            />
          </Grid>
        </InnerBox>
      </OuterBox>
    </Grid>
  );
}
