import { InnerBox, OuterBox } from './style/ProductBoxes.tsx';
import ProductAutocomplete from './ProductAutocomplete.tsx';
import { ConceptSearchType } from '../../../types/conceptSearch.ts';
import { Stack } from '@mui/system';
import { Grid, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Control, UseFormRegister } from 'react-hook-form';
import {
  DevicePackageDetails,
  DeviceProductQuantity,
} from '../../../types/product.ts';
import { Concept } from '../../../types/concept.ts';
import ProductAutoCompleteParent from './ProductAutoCompleteParent.tsx';
import ConceptService from '../../../api/ConceptService.ts';
import ProductAutoCompleteChild from './ProductAutoCompleteChild.tsx';

interface DeviceTypeFormsProps {
  productsArray: string;
  control: Control<DevicePackageDetails>;
  register: UseFormRegister<DevicePackageDetails>;
  units: Concept[];
  deviceDeviceTypes: Concept[];
  index: number;
  containedProduct: DeviceProductQuantity;
  branch: string;
}

export default function DeviceTypeForms(props: DeviceTypeFormsProps) {
  const {
    index,
    units,

    productsArray,
    control,
    register,
    containedProduct,
    deviceDeviceTypes,
    branch,
  } = props;

  const [specialFormDoses, setSpecialFormDoses] = useState<Concept[]>([]);
  const [selectedDoseForm, setSelectedDoseForm] = useState<Concept | null>(
    containedProduct.productDetails?.deviceType
      ? containedProduct.productDetails?.deviceType
      : null,
  );
  const [doseFormsearchInputValue, setDoseFormsearchInputValue] = useState('');
  const [ecl, setEcl] = useState(
    selectedDoseForm ? `< ${selectedDoseForm.conceptId}` : undefined,
  );
  useEffect(() => {
    async function fetchSpecialFormDoses() {
      setSpecialFormDoses([]);
      try {
        // alert(selectedDoseForm);

        if (selectedDoseForm != null && selectedDoseForm.conceptId) {
          const conceptId = selectedDoseForm.conceptId.trim();
          const ecl = '<' + conceptId;

          const concepts = await ConceptService.searchConceptByEcl(ecl, branch);
          setSpecialFormDoses(concepts);
          setEcl(`< ${selectedDoseForm.conceptId}`);
        } else {
          setDoseFormsearchInputValue('');
          setEcl(undefined);
        }
      } catch (error) {
        console.log(error);
      }
    }
    void fetchSpecialFormDoses().then(r => r);
  }, [selectedDoseForm]);
  return (
    <Grid xs={6} key={'right'} item={true}>
      <OuterBox component="fieldset">
        <legend>Device Forms</legend>
        <InnerBox component="fieldset">
          <legend>Device Type</legend>
          <ProductAutoCompleteParent
            optionValues={deviceDeviceTypes}
            searchType={ConceptSearchType.device_device_type}
            name={`${productsArray}[${index}].productDetails.deviceType`}
            control={control}
            setval={setSelectedDoseForm}
            branch={branch}
          />
        </InnerBox>
        <InnerBox component="fieldset">
          <legend>Specific Device Type</legend>

          <ProductAutoCompleteChild
            optionValues={specialFormDoses}
            name={`${productsArray}[${index}].productDetails.specificDeviceType`}
            control={control}
            inputValue={doseFormsearchInputValue}
            setInputValue={setDoseFormsearchInputValue}
            ecl={ecl}
            branch={branch}
          />
        </InnerBox>

        <InnerBox component="fieldset">
          <legend>Pack Size</legend>

          <Stack direction="row" spacing={2} alignItems={'center'}>
            <Grid item xs={2}>
              <TextField
                {...register(
                  `${productsArray}[${index}].value` as 'containedProducts.0.value',
                )}
                fullWidth
                variant="outlined"
                margin="dense"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={10}>
              <ProductAutocomplete
                optionValues={units}
                searchType={ConceptSearchType.units}
                name={`${productsArray}[${index}].unit`}
                control={control}
                branch={branch}
              />
            </Grid>
          </Stack>
        </InnerBox>
      </OuterBox>
    </Grid>
  );
}
