import { InnerBox, OuterBox } from './style/ProductBoxes.tsx';
import ProductAutocomplete from './ProductAutocomplete.tsx';
import { ConceptSearchType } from '../../../types/conceptSearch.ts';
import { Stack } from '@mui/system';
import { Grid, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Control, UseFormRegister, useWatch } from 'react-hook-form';

import { Concept } from '../../../types/concept.ts';
import { MedicationPackageDetails } from '../../../types/product.ts';
import ProductAutocompleteWithOpt from './ProductAutocompleteWithOpt.tsx';
import ConceptService from '../../../api/ConceptService.ts';
import ProductAutoCompleteChild from './ProductAutoCompleteChild.tsx';
import { findConceptUsingPT } from '../../../utils/helpers/conceptUtils.ts';

interface DoseFormProps {
  productsArray: string;
  control: Control<MedicationPackageDetails>;
  register: UseFormRegister<MedicationPackageDetails>;
  doseForms: Concept[];
  units: Concept[];
  medicationDeviceTypes: Concept[];
  containerTypes: Concept[];
  index: number;
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
    containerTypes,
    medicationDeviceTypes,
    branch,
  } = props;

  const doseFormWatched = useWatch({
    control,
    name: `${productsArray}[${index}].productDetails.genericForm` as 'containedProducts.0.productDetails.genericForm',
  }) as Concept;
  const specificDoseFormWatched = useWatch({
    control,
    name: `${productsArray}[${index}].productDetails.specificForm` as 'containedProducts.0.productDetails.specificForm',
  }) as Concept;

  const [doseFormsearchInputValue, setDoseFormsearchInputValue] = useState(
    specificDoseFormWatched ? specificDoseFormWatched.pt.term : '',
  );
  const [specialFormDoses, setSpecialFormDoses] = useState<Concept[]>([]);
  const [ecl, setEcl] = useState<string | undefined>(
    doseFormWatched ? `< ${doseFormWatched.conceptId}` : undefined,
  );

  useEffect(() => {
    async function fetchSpecialFormDoses() {
      try {
        setSpecialFormDoses([]);
        if (doseFormWatched != null && doseFormWatched.conceptId) {
          const conceptId = doseFormWatched.conceptId.trim();
          const ecl = '<' + conceptId;

          const concepts = await ConceptService.searchConceptByEcl(ecl, branch);
          setSpecialFormDoses(concepts);

          setEcl(`< ${doseFormWatched.conceptId}`);
          if (findConceptUsingPT(doseFormsearchInputValue, concepts) === null) {
            setDoseFormsearchInputValue('');
          }
        } else {
          setDoseFormsearchInputValue('');
          setEcl(undefined);
          setSpecialFormDoses([]);
        }
      } catch (error) {
        console.log(error);
      }
    }
    void fetchSpecialFormDoses().then(r => r);
  }, [doseFormWatched]);

  return (
    <Grid xs={6} key={'right'} item={true}>
      <OuterBox component="fieldset">
        <legend>Dose Forms</legend>
        <InnerBox component="fieldset">
          <legend>Generic Dose Form</legend>
          <ProductAutocomplete
            optionValues={doseForms}
            searchType={ConceptSearchType.doseForms}
            name={`${productsArray}[${index}].productDetails.genericForm`}
            control={control}
            branch={branch}
          />
        </InnerBox>
        <InnerBox component="fieldset">
          <legend>Specific Dose Form</legend>

          <ProductAutoCompleteChild
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
