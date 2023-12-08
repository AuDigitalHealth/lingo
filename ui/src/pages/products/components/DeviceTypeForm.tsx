import { InnerBox, OuterBox } from './style/ProductBoxes.tsx';
import ProductAutocomplete from './ProductAutocomplete.tsx';
import { ConceptSearchType } from '../../../types/conceptSearch.ts';
import { Stack } from '@mui/system';
import { Grid, TextField } from '@mui/material';
import { Control, UseFormRegister } from 'react-hook-form';
import { DevicePackageDetails } from '../../../types/product.ts';
import { Concept } from '../../../types/concept.ts';

import SpecificDeviceType from './SpecificDeviceType.tsx';
import { nanoid } from 'nanoid';

interface DeviceTypeFormsProps {
  productsArray: string;
  control: Control<DevicePackageDetails>;
  register: UseFormRegister<DevicePackageDetails>;
  units: Concept[];
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

    branch,
  } = props;

  return (
    <Grid xs={6} key={'right'} item={true}>
      <OuterBox component="fieldset">
        <legend>Device Forms</legend>
        <InnerBox component="fieldset">
          <legend>Device Type</legend>
          <ProductAutocomplete
            optionValues={[]}
            searchType={ConceptSearchType.device_device_type}
            name={`${productsArray}[${index}].productDetails.deviceType`}
            control={control}
            branch={branch}
          />
        </InnerBox>
        <InnerBox component="fieldset">
          <legend>Specific Device Type</legend>

          <SpecificDeviceType
            index={index}
            control={control}
            branch={branch}
            productsArray={productsArray}
            key={nanoid()}
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
