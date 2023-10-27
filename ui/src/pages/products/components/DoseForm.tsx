import { InnerBox, OuterBox } from './style/ProductBoxes.tsx';
import ProductAutocomplete from './ProductAutocomplete.tsx';
import { ConceptSearchType } from '../../../types/conceptSearch.ts';
import { Stack } from '@mui/system';
import { Grid, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Control, UseFormRegister } from 'react-hook-form';
import {
  MedicationPackageDetails,
  MedicationProductQuantity,
} from '../../../types/authoring.ts';
import { Concept } from '../../../types/concept.ts';
import DoseFormAutoCompleteNew from './DoseFormAutoCompleteNew.tsx';
import ConceptService from '../../../api/ConceptService.ts';
import SpecialDoseFormAutocomplete from './SpecialDoseFormAutoComplete.tsx';

interface DoseFormProps {
  productsArray: string;
  control: Control<MedicationPackageDetails>;
  register: UseFormRegister<MedicationPackageDetails>;
  doseForms: Concept[];
  units: Concept[];
  index: number;
  containedProduct: MedicationProductQuantity;
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

          const concepts = await ConceptService.searchConceptByEcl(ecl);
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
          <DoseFormAutoCompleteNew
            optionValues={doseForms}
            searchType={ConceptSearchType.doseForms}
            name={`${productsArray}[${index}].productDetails.genericForm`}
            control={control}
            setval={setSelectedDoseForm}
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
              />
            </Grid>
          </Stack>
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
              />
            </Grid>
          </Stack>
        </InnerBox>
      </OuterBox>
    </Grid>
  );
}
