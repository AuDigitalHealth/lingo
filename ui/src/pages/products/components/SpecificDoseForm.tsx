import React, { useEffect, useState } from 'react';
import { Control, useWatch } from 'react-hook-form';

import { Concept } from '../../../types/concept.ts';
import { MedicationPackageDetails } from '../../../types/product.ts';
import ConceptService from '../../../api/ConceptService.ts';
import ProductAutoCompleteChild from './ProductAutoCompleteChild.tsx';
import { findConceptUsingPT } from '../../../utils/helpers/conceptUtils.ts';

interface SpecificDoseFormProps {
  productsArray: string;
  control: Control<MedicationPackageDetails>;
  index: number;
  branch: string;
}

export default function SpecificDoseForm(props: SpecificDoseFormProps) {
  const {
    index,

    productsArray,
    control,
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchSpecialFormDoses() {
      try {
        setIsLoading(true);
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
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    }
    void fetchSpecialFormDoses().then(r => r);
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
      />
    </>
  );
}
