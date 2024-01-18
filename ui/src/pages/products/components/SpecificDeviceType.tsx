import React, { useEffect, useState } from 'react';
import { Control, UseFormGetValues, useWatch } from 'react-hook-form';
import { DevicePackageDetails } from '../../../types/product.ts';
import { Concept } from '../../../types/concept.ts';

import ProductAutoCompleteChild from './ProductAutoCompleteChild.tsx';

import { FieldBindings } from '../../../types/FieldBindings.ts';
import { generateEclForDevice } from '../../../utils/helpers/EclUtils.ts';

interface SpecificDeviceTypeProps {
  productsArray: string;
  control: Control<DevicePackageDetails>;
  index: number;
  branch: string;
  fieldBindings: FieldBindings;
  getValues: UseFormGetValues<DevicePackageDetails>;
}

export default function SpecificDeviceType(props: SpecificDeviceTypeProps) {
  const { index, productsArray, control, branch, fieldBindings, getValues } =
    props;

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
      specificDeviceTypeWatched
        ? (specificDeviceTypeWatched.pt?.term as string)
        : '',
    );
  const [ecl, setEcl] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    function fetchSpecialFormDoses() {
      try {
        setIsLoading(true);
        setSpecificDeviceTypes([]);

        if (deviceTypeWatched != null && deviceTypeWatched.conceptId) {
          const fieldEclGenerated = generateEclForDevice(
            fieldBindings,
            'deviceProduct.specificDeviceType',
            index,
            productsArray,
            getValues,
          );

          setEcl(fieldEclGenerated.generatedEcl);
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
    fetchSpecialFormDoses();
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
        showDefaultOptions={true}
      />
    </>
  );
}
