import { InnerBox, OuterBox } from './style/ProductBoxes.tsx';
import ProductAutocomplete from './ProductAutocomplete.tsx';
import { ConceptSearchType } from '../../../types/conceptSearch.ts';
import { Stack } from '@mui/system';
import { Grid, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Control, UseFormRegister, useWatch } from 'react-hook-form';
import { DevicePackageDetails } from '../../../types/product.ts';
import { Concept } from '../../../types/concept.ts';

import ConceptService from '../../../api/ConceptService.ts';
import ProductAutoCompleteChild from './ProductAutoCompleteChild.tsx';
import { findConceptUsingPT } from '../../../utils/helpers/conceptUtils.ts';

interface DeviceTypeFormsProps {
  productsArray: string;
  control: Control<DevicePackageDetails>;
  register: UseFormRegister<DevicePackageDetails>;
  units: Concept[];
  deviceDeviceTypes: Concept[];
  index: number;
  branch: string;
}

export default function DeviceTypeForms(props: DeviceTypeFormsProps) {
  const {
    index,
    units,

    productsArray,
    control,
    register,
    deviceDeviceTypes,
    branch,
  } = props;

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
    <Grid xs={6} key={'right'} item={true}>
      <OuterBox component="fieldset">
        <legend>Device Forms</legend>
        <InnerBox component="fieldset">
          <legend>Device Type</legend>
          <ProductAutocomplete
            optionValues={deviceDeviceTypes}
            searchType={ConceptSearchType.device_device_type}
            name={`${productsArray}[${index}].productDetails.deviceType`}
            control={control}
            branch={branch}
          />
        </InnerBox>
        <InnerBox component="fieldset">
          <legend>Specific Device Type</legend>

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
