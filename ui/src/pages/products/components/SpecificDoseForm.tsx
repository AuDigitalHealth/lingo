import React, { useEffect, useState } from 'react';
import { Control, UseFormGetValues, useWatch } from 'react-hook-form';

import { Concept } from '../../../types/concept.ts';
import { MedicationPackageDetails } from '../../../types/product.ts';

import ProductAutoCompleteChild from './ProductAutoCompleteChild.tsx';

import { generateEclForMedication } from '../../../utils/helpers/EclUtils.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';

interface SpecificDoseFormProps {
  productsArray: string;
  control: Control<MedicationPackageDetails>;
  index: number;
  branch: string;
  fieldBindings: FieldBindings;
  getValues: UseFormGetValues<MedicationPackageDetails>;
}

export default function SpecificDoseForm(props: SpecificDoseFormProps) {
  const {
    index,

    productsArray,
    control,
    branch,
    getValues,
    fieldBindings,
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
    specificDoseFormWatched ? (specificDoseFormWatched.pt?.term as string) : '',
  );
  const [specialFormDoses, setSpecialFormDoses] = useState<Concept[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ecl, setEcl] = useState<string>();
  useEffect(() => {
    function fetchSpecialFormDoses() {
      try {
        setIsLoading(true);
        if (doseFormWatched != null && doseFormWatched.conceptId) {
          const fieldEclGenerated = generateEclForMedication(
            fieldBindings,
            'medicationProduct.specificForm',
            index,
            productsArray,
            getValues,
          );

          setEcl(fieldEclGenerated.generatedEcl);
        } else {
          setDoseFormsearchInputValue('');
          setEcl(undefined);
          setSpecialFormDoses([]);
        }
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    }
    fetchSpecialFormDoses();
  }, [doseFormWatched]);

  return (
    <>
      <ProductAutoCompleteChild
        optionValues={specialFormDoses}
        name={`${productsArray}[${index}].productDetails.specificForm`}
        control={control}
        inputValue={doseFormsearchInputValue}
        setInputValue={setDoseFormsearchInputValue}
        ecl={ecl}
        branch={branch}
        isLoading={isLoading}
        showDefaultOptions={true}
      />
    </>
  );
}
