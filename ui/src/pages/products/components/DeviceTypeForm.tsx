import { InnerBox, OuterBox } from './style/ProductBoxes.tsx';

import { Stack } from '@mui/system';
import { Grid, TextField } from '@mui/material';
import { Control, UseFormGetValues, UseFormRegister } from 'react-hook-form';
import { DevicePackageDetails } from '../../../types/product.ts';

import SpecificDeviceType from './SpecificDeviceType.tsx';
import { nanoid } from 'nanoid';
import ProductAutocompleteV2 from './ProductAutocompleteV2.tsx';
import { generateEclFromBinding } from '../../../utils/helpers/EclUtils.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';

interface DeviceTypeFormsProps {
  productsArray: string;
  control: Control<DevicePackageDetails>;
  register: UseFormRegister<DevicePackageDetails>;

  index: number;
  branch: string;
  fieldBindings: FieldBindings;
  getValues: UseFormGetValues<DevicePackageDetails>;
}

export default function DeviceTypeForms(props: DeviceTypeFormsProps) {
  const {
    index,

    productsArray,
    control,
    register,

    branch,
    fieldBindings,
    getValues,
  } = props;

  return (
    <Grid xs={6} key={'right'} item={true}>
      <OuterBox component="fieldset">
        <legend>Device Forms</legend>
        <InnerBox component="fieldset">
          <legend>Device Type</legend>
          <ProductAutocompleteV2
            name={`${productsArray}[${index}].productDetails.deviceType`}
            control={control}
            branch={branch}
            ecl={generateEclFromBinding(
              fieldBindings,
              'deviceProduct.deviceType',
            )}
            showDefaultOptions={true}
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
            fieldBindings={fieldBindings}
            getValues={getValues}
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
              <ProductAutocompleteV2
                name={`${productsArray}[${index}].unit`}
                control={control}
                branch={branch}
                ecl={generateEclFromBinding(
                  fieldBindings,
                  'deviceProduct.quantity.unit',
                )}
                //TODO update key
              />
            </Grid>
          </Stack>
        </InnerBox>
      </OuterBox>
    </Grid>
  );
}
