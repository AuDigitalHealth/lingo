import React, { useEffect, useState } from 'react';
import {
  Control,
  FieldError,
  FieldErrors,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import { DevicePackageDetails } from '../../../types/product.ts';
import { Concept } from '../../../types/concept.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';
import {
  generateEclForDevice,
  generateEclFromBinding,
} from '../../../utils/helpers/EclUtils.ts';
import {
  isValidConcept,
  setEmptyToNull,
} from '../../../utils/helpers/conceptUtils.ts';
import { showError } from '../../../types/ErrorHandler.ts';
import ProductAutocompleteWithOpt from './ProductAutocompleteWithOpt.tsx';
import { Grid, TextField } from '@mui/material';
import { FieldLabel, InnerBox, OuterBox } from './style/ProductBoxes.tsx';
import ProductAutocompleteMultiSelect from './ProductAutocompleteMultiSelect.tsx';
import { Stack } from '@mui/system';

interface SpecificDeviceTypeProps {
  productsArray: string;
  control: Control<DevicePackageDetails>;
  index: number;
  branch: string;
  fieldBindings: FieldBindings;
  getValues: UseFormGetValues<DevicePackageDetails>;
  register: UseFormRegister<DevicePackageDetails>;
  selectedDeviceType: Concept | null;
  errors?: FieldErrors<DevicePackageDetails>;
  setSelectedDeviceType: (concept: Concept | null) => void;
  setValue: UseFormSetValue<any>;
}

export default function SpecificDeviceType(props: SpecificDeviceTypeProps) {
  const {
    index,
    productsArray,
    control,
    branch,
    fieldBindings,
    getValues,
    errors,
    selectedDeviceType,
    setSelectedDeviceType,
    setValue,
    register,
  } = props;

  const specificDeviceTypeError = errors?.containedProducts?.[index]
    ?.productDetails?.specificDeviceType as FieldError;
  const newSpecificDeviceNameError = errors?.containedProducts?.[index]
    ?.productDetails?.newSpecificDeviceName as FieldError;

  const otherParentConceptError = errors?.containedProducts?.[index]
    ?.productDetails?.otherParentConcepts as FieldError;

  const [ecl, setEcl] = useState<string>();
  const parentConcept = useWatch({
    control,
    name: `${productsArray}[${index}].productDetails.deviceType` as 'containedProducts.0.productDetails.deviceType',
  });
  const [selectedSpecificDeviceType, setSelectedSpecificDeviceType] = useState<
    Concept | undefined | null
  >(
    getValues(
      `${productsArray}[${index}].productDetails.specificDeviceType` as 'containedProducts.0.productDetails.specificDeviceType',
    ),
  );
  const [specificDeviceDisabled, setSpecificDeviceDisabled] = useState(
    parentConcept && parentConcept.conceptId ? false : true,
  );
  const handleSelectedSpecificDeviceType = (concept: Concept | null) => {
    //TODO lets not clear it
    // if (concept) {
    //   setValue(
    //     `${productsArray}[${index}].productDetails.newSpecificDeviceName` as 'containedProducts.0.productDetails.newSpecificDeviceName',
    //     null,
    //     { shouldDirty: false },
    //   );
    //   setValue(
    //     `${productsArray}[${index}].productDetails.otherParentConcepts` as 'containedProducts.0.productDetails.otherParentConcepts',
    //     null,
    //     { shouldDirty: false },
    //   );
    // }
    setSelectedSpecificDeviceType(concept);
  };

  const isNewSpecificConceptPanelDisabled = () => {
    return selectedSpecificDeviceType ? true : false;
  };
  useEffect(() => {
    function fetchSpeficDeviceTypes() {
      if (!parentConcept) {
        setSpecificDeviceDisabled(true);
        setEcl(undefined);
      }
      try {
        if (
          isValidConcept(selectedDeviceType) ||
          isValidConcept(parentConcept)
        ) {
          if (selectedDeviceType) {
            setValue(
              `${productsArray}[${index}].productDetails.specificDeviceType` as 'containedProducts.0.productDetails.specificDeviceType',
              null,
              { shouldDirty: false },
            );
          }
          const fieldEclGenerated = generateEclForDevice(
            fieldBindings,
            'deviceProduct.specificDeviceType',
            index,
            productsArray,
            getValues,
          );

          setEcl(fieldEclGenerated.generatedEcl);
        } else {
          setEcl(undefined);
        }
      } catch (error) {
        showError('Field binding error');
      }
    }
    fetchSpeficDeviceTypes();
  }, [parentConcept, selectedDeviceType, setSelectedDeviceType]);

  return (
    <>
      <Stack direction="row" spacing={2} alignItems={'center'}>
        <Grid item xs={4}>
          <InnerBox component="fieldset">
            <FieldLabel>Specific Device Type</FieldLabel>
            <ProductAutocompleteWithOpt
              dataTestId=""
              optionValues={[]}
              name={`${productsArray}[${index}].productDetails.specificDeviceType`}
              control={control}
              ecl={ecl}
              branch={branch}
              showDefaultOptions={true}
              handleChange={handleSelectedSpecificDeviceType}
              disabled={specificDeviceDisabled}
              setDisabled={setSpecificDeviceDisabled}
              error={specificDeviceTypeError}
              clearValue={specificDeviceDisabled}
            />
          </InnerBox>
        </Grid>
        <Grid item xs={1}>
          <legend style={{ textAlign: 'center' }}>
            OR<span style={{ color: '#FF0000' }}>*</span>
          </legend>
        </Grid>

        <Grid item xs={7}>
          <OuterBox component="fieldset">
            <legend></legend>
            <InnerBox component="fieldset">
              <FieldLabel>New Specific Device Name</FieldLabel>
              <TextField
                {...register(
                  `${productsArray}[${index}].productDetails.newSpecificDeviceName` as 'containedProducts.0.productDetails.newSpecificDeviceName',
                  { required: false, setValueAs: setEmptyToNull },
                )}
                fullWidth
                disabled={isNewSpecificConceptPanelDisabled()}
                variant="outlined"
                margin="dense"
                InputLabelProps={{ shrink: true }}
                error={!!newSpecificDeviceNameError}
                helperText={
                  newSpecificDeviceNameError?.message
                    ? newSpecificDeviceNameError?.message
                    : ' '
                }
              />
            </InnerBox>

            <InnerBox component="fieldset">
              <FieldLabel>Other Parent Concept</FieldLabel>
              <ProductAutocompleteMultiSelect
                name={`${productsArray}[${index}].productDetails.otherParentConcepts`}
                control={control}
                branch={branch}
                ecl={generateEclFromBinding(
                  fieldBindings,
                  'deviceProduct.otherParentConcepts',
                )}
                showDefaultOptions={false}
                error={otherParentConceptError}
                maxHeightProvided={200}
                disabled={isNewSpecificConceptPanelDisabled()}
              />
            </InnerBox>
          </OuterBox>
        </Grid>
      </Stack>
    </>
  );
}
