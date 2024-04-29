import React, { useEffect, useState } from 'react';
import {
  Control,
  UseFormGetValues,
  UseFormSetValue,
  useWatch,
} from 'react-hook-form';

import { Concept } from '../../../types/concept.ts';
import { MedicationPackageDetails } from '../../../types/product.ts';

import { generateEclForMedication } from '../../../utils/helpers/EclUtils.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';

import { isValidConcept } from '../../../utils/helpers/conceptUtils.ts';

import { showError } from '../../../types/ErrorHandler.ts';
import ProductAutocompleteWithOpt from './ProductAutocompleteWithOpt.tsx';

interface SpecificDoseFormProps {
  productsArray: string;
  control: Control<MedicationPackageDetails>;
  index: number;
  branch: string;
  fieldBindings: FieldBindings;
  getValues: UseFormGetValues<MedicationPackageDetails>;
  selectedDoseForm: Concept | null;
  setSelectedDoseForm: (concept: Concept | null) => void;
  setValue: UseFormSetValue<any>;
}

export default function SpecificDoseForm(props: SpecificDoseFormProps) {
  const {
    index,

    productsArray,
    control,
    branch,
    getValues,
    fieldBindings,
    selectedDoseForm,
    setSelectedDoseForm,
    setValue,
  } = props;

  const [ecl, setEcl] = useState<string>();

  const parentConcept = useWatch({
    control,
    name: `${productsArray}[${index}].productDetails.genericForm` as 'containedProducts.0.productDetails.genericForm',
  });

  const [optionDisabled, setOptionDisabled] = useState(
    parentConcept && parentConcept.conceptId ? false : true,
  );

  useEffect(() => {
    function fetchSpecialFormDoses() {
      if (!parentConcept) {
        setOptionDisabled(true);
        setEcl(undefined);
      }
      try {
        if (isValidConcept(selectedDoseForm) || isValidConcept(parentConcept)) {
          if (selectedDoseForm) {
            setValue(
              `${productsArray}[${index}].productDetails.specificForm` as 'containedProducts.0.productDetails.specificForm',
              null,
              { shouldDirty: false },
            );
          }
          const fieldEclGenerated = generateEclForMedication(
            fieldBindings,
            'medicationProduct.specificForm',
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
    fetchSpecialFormDoses();
  }, [parentConcept, selectedDoseForm, setSelectedDoseForm]);

  return (
    <>
      <ProductAutocompleteWithOpt
        optionValues={[]}
        name={`${productsArray}[${index}].productDetails.specificForm`}
        control={control}
        ecl={ecl}
        branch={branch}
        showDefaultOptions={true}
        disabled={optionDisabled}
        setDisabled={setOptionDisabled}
        clearValue={optionDisabled}
        dataTestId={`product-${index}-specific-dose-form`}
      />
    </>
  );
}
