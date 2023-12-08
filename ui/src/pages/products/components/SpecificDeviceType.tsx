import React, { useEffect, useState } from 'react';
import { Control, useWatch } from 'react-hook-form';
import { DevicePackageDetails } from '../../../types/product.ts';
import { Concept } from '../../../types/concept.ts';

import ConceptService from '../../../api/ConceptService.ts';
import ProductAutoCompleteChild from './ProductAutoCompleteChild.tsx';
import { findConceptUsingPT } from '../../../utils/helpers/conceptUtils.ts';

interface SpecificDeviceTypeProps {
  productsArray: string;
  control: Control<DevicePackageDetails>;
  index: number;
  branch: string;
}

export default function SpecificDeviceType(props: SpecificDeviceTypeProps) {
  const { index, productsArray, control, branch } = props;

  const deviceTypeWatched = useWatch({
    control,
    name: `${productsArray}[${index}].productDetails.deviceType` as 'containedProducts.0.productDetails.deviceType',
  });
  const specificDeviceTypeWatched = useWatch({
    control,
    name: `${productsArray}[${index}].productDetails.specificDeviceType` as 'containedProducts.0.productDetails.specificDeviceType',
  });

  const [specificDeviceTypes, setSpecificDeviceTypes] = useState<Concept[]>([]);
  const [specificDeviceInputSearchValue, setSpecificDeviceInputSearchValue] =
    useState(
      specificDeviceTypeWatched ? specificDeviceTypeWatched.pt.term : '',
    );
  const [ecl, setEcl] = useState<string | undefined>(
    deviceTypeWatched ? `< ${deviceTypeWatched.conceptId}` : undefined,
  );
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    async function fetchSpecialFormDoses() {
      try {
        setIsLoading(true);
        setSpecificDeviceTypes([]);

        if (deviceTypeWatched != null && deviceTypeWatched.conceptId) {
          const conceptId = deviceTypeWatched.conceptId.trim();
          const ecl = '<' + conceptId;

          const concepts = await ConceptService.searchConceptByEcl(ecl, branch);
          setSpecificDeviceTypes(concepts);
          setEcl(`< ${deviceTypeWatched.conceptId}`);
          if (
            findConceptUsingPT(specificDeviceInputSearchValue, concepts) ===
            null
          ) {
            setSpecificDeviceInputSearchValue('');
          }
        } else {
          setSpecificDeviceInputSearchValue('');
          setEcl(undefined);
          setSpecificDeviceTypes([]);
        }
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        console.log(error);
      }
    }
    void fetchSpecialFormDoses().then(r => r);
  }, [deviceTypeWatched]);
  return (
    <>
      <ProductAutoCompleteChild
        optionValues={specificDeviceTypes}
        name={`${productsArray}[${index}].productDetails.specificDeviceType`}
        control={control}
        inputValue={specificDeviceInputSearchValue}
        setInputValue={setSpecificDeviceInputSearchValue}
        ecl={ecl}
        branch={branch}
        isLoading={isLoading}
      />
    </>
  );
}
