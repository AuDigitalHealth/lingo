import { InnerBox, OuterBox } from './style/ProductBoxes.tsx';
import ProductAutocomplete from './ProductAutocomplete.tsx';
import { ConceptSearchType } from '../../../types/conceptSearch.ts';
import { Stack } from '@mui/system';
import { Grid, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Control, UseFormRegister } from 'react-hook-form';

import { Concept } from '../../../types/concept.ts';
import DoseFormAutoComplete from './DoseFormAutocomplete.tsx';
import ConceptService from '../../../api/ConceptService.ts';
import SpecialDoseFormAutocomplete from './SpecialDoseFormAutoComplete.tsx';
import {
  MedicationPackageDetails,
  MedicationProductQuantity,
} from '../../../types/product.ts';
import ProductAutocompleteWithOpt from './ProductAutocompleteWithOpt.tsx';

interface DoseFormProps {
  productsArray: string;
  control: Control<MedicationPackageDetails>;
  register: UseFormRegister<MedicationPackageDetails>;
  doseForms: Concept[];
  units: Concept[];
  medicationDeviceTypes: Concept[];
  containerTypes: Concept[];
  index: number;
  containedProduct: MedicationProductQuantity;
  branch: string;
}

export default function DoseForms(props: DoseFormProps) {
  const {
    index,
    units,
    doseForms,

    productsArray,
    control,
    register,
    containedProduct,
    containerTypes,
    medicationDeviceTypes,
    branch,
  } = props;

  const [specialFormDoses, setSpecialFormDoses] = useState<Concept[]>([]);
  const [selectedDoseForm, setSelectedDoseForm] = useState<Concept | null>(
    containedProduct.productDetails?.genericForm
      ? containedProduct.productDetails?.genericForm
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
        <legend>Dose Forms</legend>
        <InnerBox component="fieldset">
          <legend>Generic Dose Form</legend>
          <DoseFormAutoComplete
            optionValues={doseForms}
            searchType={ConceptSearchType.doseForms}
            name={`${productsArray}[${index}].productDetails.genericForm`}
            control={control}
            setval={setSelectedDoseForm}
            branch={branch}
          />
        </InnerBox>
        <InnerBox component="fieldset">
          <legend>Specific Dose Form</legend>

          <SpecialDoseFormAutocomplete
            optionValues={specialFormDoses}
            name={`${productsArray}[${index}].productDetails.specificForm`}
            control={control}
            inputValue={doseFormsearchInputValue}
            setInputValue={setDoseFormsearchInputValue}
            ecl={ecl}
            branch={branch}
          />
        </InnerBox>

        <InnerBox component="fieldset">
          <legend>Unit Size</legend>

          <Stack direction="row" spacing={2} alignItems={'center'}>
            <Grid item xs={2}>
              <TextField
                {...register(
                  `${productsArray}[${index}].productDetails.quantity.value` as 'containedProducts.0.productDetails.quantity.value',
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
                name={`${productsArray}[${index}].productDetails.quantity.unit`}
                control={control}
                branch={branch}
              />
            </Grid>
          </Stack>
        </InnerBox>
        <DoseFormsDeviceSection
          medicationDeviceTypes={medicationDeviceTypes}
          containerTypes={containerTypes}
          control={control}
          index={index}
          productsArray={productsArray}
          branch={branch}
        />

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

interface DoseFormsDeviceSectionProps {
  productsArray: string;
  control: Control<MedicationPackageDetails>;
  medicationDeviceTypes: Concept[];
  containerTypes: Concept[];
  index: number;
  branch: string;
}

function DoseFormsDeviceSection(props: DoseFormsDeviceSectionProps) {
  const {
    index,
    productsArray,
    control,
    containerTypes,
    medicationDeviceTypes,
    branch,
  } = props;

  const [deviceTypeDisabled, setDeviceTypeDisabled] = useState(false);
  const [containerTypeDisabled, setContainerTypeDisabled] = useState(false);
  const [selectedContainerType, setSelectedContainerType] =
    useState<Concept | null>(null);
  const [selectedDeviceType, setSelectedDeviceType] = useState<Concept | null>(
    null,
  );
  const handleSelectedContainerTypeChange = (concept: Concept | null) => {
    if (concept !== null) {
      setDeviceTypeDisabled(true);
    } else {
      setDeviceTypeDisabled(false);
    }
    setSelectedContainerType(concept);
  };
  const handleSelectedDeviceTypeChange = (concept: Concept | null) => {
    if (concept !== null) {
      setContainerTypeDisabled(true);
    } else {
      setContainerTypeDisabled(false);
    }
    setSelectedDeviceType(concept);
  };
  return (
    <>
      <Stack direction="row" spacing={2} alignItems={'center'}>
        <Grid item xs={5}>
          <InnerBox component="fieldset">
            <legend>Container Type</legend>
            <ProductAutocompleteWithOpt
              optionValues={containerTypes}
              searchType={ConceptSearchType.containerTypes}
              name={`${productsArray}[${index}].productDetails.containerType`}
              control={control}
              handleChange={handleSelectedContainerTypeChange}
              disabled={containerTypeDisabled}
              setDisabled={setContainerTypeDisabled}
              branch={branch}
            />
          </InnerBox>
        </Grid>
        <Grid item xs={2}>
          <legend style={{ textAlign: 'center' }}>OR</legend>
          {/*<Typography sx={{textAlign:"center"}}> OR</Typography>*/}
        </Grid>
        <Grid item xs={5}>
          <InnerBox component="fieldset">
            <legend>Device Type</legend>
            <ProductAutocompleteWithOpt
              optionValues={medicationDeviceTypes}
              searchType={ConceptSearchType.medication_device_type}
              name={`${productsArray}[${index}].productDetails.deviceType`}
              control={control}
              disabled={deviceTypeDisabled}
              setDisabled={setDeviceTypeDisabled}
              handleChange={handleSelectedDeviceTypeChange}
              branch={branch}
            />
          </InnerBox>
        </Grid>
      </Stack>
    </>
  );
}
