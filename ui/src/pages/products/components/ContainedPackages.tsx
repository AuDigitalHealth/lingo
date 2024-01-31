import React, { useState } from 'react';
import {
  defaultPackage,
  isValidConceptName,
} from '../../../utils/helpers/conceptUtils.ts';
import {
  MedicationPackageDetails,
  ProductType,
} from '../../../types/product.ts';
import { InnerBox, Level1Box, Level2Box } from './style/ProductBoxes.tsx';
import Box from '@mui/material/Box';
import { Grid, IconButton, Tab, Tabs, TextField, Tooltip } from '@mui/material';
import CustomTabPanel, { a11yProps } from './CustomTabPanel.tsx';
import { AddCircle, Delete } from '@mui/icons-material';
import SearchAndAddIcon from '../../../components/icons/SearchAndAddIcon.tsx';
import PackageSearchAndAddModal from './PackageSearchAndAddModal.tsx';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';
import { Stack } from '@mui/system';

import { Concept } from '../../../types/concept.ts';
import {
  Control,
  FieldArrayWithId,
  FieldError,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormGetValues,
  UseFormRegister,
  useWatch,
} from 'react-hook-form';
import ArtgAutoComplete from './ArtgAutoComplete.tsx';
import { FieldBindings } from '../../../types/FieldBindings.ts';
import ProductAutocompleteV2 from './ProductAutocompleteV2.tsx';
import { generateEclFromBinding } from '../../../utils/helpers/EclUtils.ts';
import ContainedPackageProducts from './ContainedPackageProducts.tsx';

interface ContainedMedicationPackagesProps {
  control: Control<MedicationPackageDetails>;
  register: UseFormRegister<MedicationPackageDetails>;
  packageFields: FieldArrayWithId<
    MedicationPackageDetails,
    'containedPackages',
    'id'
  >[];
  packageAppend: UseFieldArrayAppend<
    MedicationPackageDetails,
    'containedPackages'
  >;
  packageRemove: UseFieldArrayRemove;
  // watch: UseFormWatch<MedicationPackageDetails>;
  setActivePackageTabIndex: (value: number) => void;
  activePackageTabIndex: number;
  productType: ProductType;
  branch: string;
  fieldBindings: FieldBindings;
  getValues: UseFormGetValues<MedicationPackageDetails>;
  defaultUnit: Concept;
  errors: FieldErrors<MedicationPackageDetails>;
  expandedProducts: string[];
  setExpandedProducts: (value: string[]) => void;
}

function ContainedPackages(props: ContainedMedicationPackagesProps) {
  const {
    control,
    register,
    packageFields,
    packageRemove,
    packageAppend,
    setActivePackageTabIndex,
    activePackageTabIndex,
    productType,

    branch,
    fieldBindings,
    getValues,
    defaultUnit,
    errors,
    expandedProducts,
    setExpandedProducts,
  } = props;

  const [modalOpen, setModalOpen] = useState(false);
  // const {defaultUnit} = useInitializeDefaultUnit(branch);

  const handleToggleModal = () => {
    setModalOpen(!modalOpen);
  };

  const [disabled, setDisabled] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState(-1);

  const handleDeletePackage = () => {
    packageRemove(indexToDelete);
    setDeleteModalOpen(false);
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setActivePackageTabIndex(newValue);
  };

  const handlePackageCreation = () => {
    packageAppend(defaultPackage(defaultUnit, getValues('productName')));
    setActivePackageTabIndex(packageFields.length);
  };

  const handleSearchAndAddPackage = () => {
    handleToggleModal();
    setActivePackageTabIndex(packageFields.length);
  };

  return (
    <div key={'package-details'}>
      <Level1Box component="fieldset">
        <legend>Contained Packages</legend>

        <Box
          sx={{
            borderBottom: packageFields.length > 0 ? 1 : 0,
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Grid item xs={10}>
              <Tabs
                value={activePackageTabIndex}
                onChange={handleChange}
                aria-label="package tab"
              >
                {packageFields.map(
                  (
                    containedPackage: FieldArrayWithId<
                      MedicationPackageDetails,
                      'containedPackages'
                    >,
                    index,
                  ) => {
                    return (
                      <Tab
                        label={
                          <PackageNameWatched control={control} index={index} />
                        }
                        sx={{
                          color: !containedPackage?.packageDetails?.productName
                            ? 'red'
                            : 'inherit',
                        }}
                        {...a11yProps(index)}
                        key={index}
                      />
                    );
                  },
                )}
              </Tabs>
            </Grid>
            <Grid container justifyContent="flex-end">
              <IconButton
                onClick={handlePackageCreation}
                aria-label="create"
                size="large"
              >
                <Tooltip title={'Create new package'}>
                  <AddCircle fontSize="medium" />
                </Tooltip>
              </IconButton>

              <Tooltip title={'Search and add an existing package'}>
                <IconButton
                  aria-label="create"
                  size="large"
                  onClick={handleSearchAndAddPackage}
                >
                  <SearchAndAddIcon width={'20px'} />
                </IconButton>
              </Tooltip>
            </Grid>
          </Stack>

          <PackageSearchAndAddModal
            open={modalOpen}
            handleClose={handleToggleModal}
            packageAppend={packageAppend}
            defaultUnit={defaultUnit}
            branch={branch}
            fieldBindings={fieldBindings}
          />
        </Box>
        {packageFields.map((containedPackage, index) => {
          return (
            <CustomTabPanel
              value={activePackageTabIndex}
              index={index}
              key={index}
            >
              <Grid container justifyContent="flex-end">
                <ConfirmationModal
                  open={deleteModalOpen}
                  content={`Remove the package "${
                    isValidConceptName(
                      containedPackage.packageDetails?.productName as Concept,
                    )
                      ? containedPackage.packageDetails?.productName?.pt?.term
                      : 'Untitled'
                  }" ?`}
                  handleClose={() => {
                    setDeleteModalOpen(false);
                  }}
                  title={'Confirm Delete Package'}
                  disabled={disabled}
                  action={'Delete'}
                  handleAction={handleDeletePackage}
                />
                <IconButton
                  onClick={() => {
                    setIndexToDelete(index);
                    setDeleteModalOpen(true);
                  }}
                  aria-label="delete"
                  size="small"
                  color="error"
                >
                  <Tooltip title={'Delete Package'}>
                    <Delete />
                  </Tooltip>
                </IconButton>
              </Grid>

              <Level2Box component="fieldset">
                <legend>Package Details</legend>
                <Stack direction="row" spacing={3} alignItems="center">
                  <Grid item xs={4}>
                    <InnerBox component="fieldset">
                      <legend>Brand Name</legend>
                      <ProductAutocompleteV2
                        name={`containedPackages[${index}].packageDetails.productName`}
                        control={control}
                        branch={branch}
                        ecl={generateEclFromBinding(
                          fieldBindings,
                          'package.productName',
                        )}
                        error={
                          errors?.containedPackages?.[index]?.packageDetails
                            ?.productName as FieldError
                        }
                      />
                    </InnerBox>
                  </Grid>

                  <Grid item xs={4}>
                    <InnerBox component="fieldset">
                      <legend>Container Type</legend>
                      <ProductAutocompleteV2
                        name={`containedPackages[${index}].packageDetails.containerType`}
                        control={control}
                        branch={branch}
                        ecl={generateEclFromBinding(
                          fieldBindings,
                          'package.containerType',
                        )}
                        showDefaultOptions={true}
                        error={
                          errors?.containedPackages?.[index]?.packageDetails
                            ?.containerType as FieldError
                        }
                      />
                    </InnerBox>
                  </Grid>
                  <Grid item xs={3}>
                    <InnerBox component="fieldset">
                      <legend>ARTG ID</legend>
                      <ArtgAutoComplete
                        control={control}
                        name={`containedPackages[${index}].packageDetails.externalIdentifiers`}
                        optionValues={[]}
                      />
                    </InnerBox>
                  </Grid>
                </Stack>

                <InnerBox component="fieldset">
                  <legend>Quantity</legend>

                  <Grid container>
                    <Grid item xs={2}>
                      <TextField
                        {...register(
                          `containedPackages.[${index}].value` as 'containedPackages.0.value',
                        )}
                        fullWidth
                        variant="outlined"
                        margin="dense"
                        InputLabelProps={{ shrink: true }}
                        error={!!errors?.containedPackages?.[index]?.value}
                        helperText={
                          errors?.containedPackages?.[index]?.value?.message
                            ? errors?.containedPackages?.[index]?.value?.message
                            : ' '
                        }
                      />
                    </Grid>
                    <Grid
                      item
                      xs={2}
                      alignItems="stretch"
                      style={{ display: 'flex' }}
                    >
                      <span
                        style={{
                          padding: '1.1rem',
                          color: 'black',
                          fontWeight: 'normal',
                        }}
                      >
                        {containedPackage.unit?.pt?.term}
                      </span>
                    </Grid>
                  </Grid>
                </InnerBox>
              </Level2Box>
              <br />
              <ContainedPackageProducts
                showTPU={true}
                packageIndex={index}
                control={control}
                register={register}
                productType={productType}
                branch={branch}
                fieldBindings={fieldBindings}
                getValues={getValues}
                defaultUnit={defaultUnit}
                errors={errors}
                expandedProducts={expandedProducts}
                setExpandedProducts={setExpandedProducts}
              />
            </CustomTabPanel>
          );
        })}
      </Level1Box>
    </div>
  );
}
function PackageNameWatched({
  control,
  index,
}: {
  control: Control<MedicationPackageDetails>;
  index: number;
}) {
  const packageName = useWatch({
    control,
    name: `containedPackages[${index}].packageDetails` as 'containedPackages.0.packageDetails',
  });

  return (
    <Tooltip
      title={
        isValidConceptName(packageName?.productName as Concept)
          ? packageName?.productName?.pt?.term
          : 'untitled*'
      }
    >
      <span>
        {isValidConceptName(packageName?.productName as Concept)
          ? packageName?.productName?.pt?.term
          : 'untitled*'}
      </span>
    </Tooltip>
  );
}
export default ContainedPackages;
