import React, { useState } from 'react';
import {
  defaultPackage,
  getDefaultUnit,
  isValidConceptName,
} from '../../../utils/helpers/conceptUtils.ts';
import { MedicationPackageDetails } from '../../../types/authoring.ts';
import { InnerBox, Level1Box, Level2Box } from './style/ProductBoxes.tsx';
import Box from '@mui/material/Box';
import { Grid, IconButton, Tab, Tabs, TextField, Tooltip } from '@mui/material';
import CustomTabPanel, { a11yProps } from './CustomTabPanel.tsx';
import { AddCircle, Delete } from '@mui/icons-material';
import SearchAndAddIcon from '../../../components/icons/SearchAndAddIcon.tsx';
import PackageSearchAndAddModal from './PackageSearchAndAddModal.tsx';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';
import { Stack } from '@mui/system';
import ContainedProducts from './ContainedProducts.tsx';
import { Concept } from '../../../types/concept.ts';
import {
  Control,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormRegister,
  useWatch,
} from 'react-hook-form';
import { ConceptSearchType } from '../../../types/conceptSearch.ts';
import ProductAutocomplete from './ProductAutocomplete.tsx';
import ArtgAutoComplete from './ArtgAutoComplete.tsx';

interface ContainedPackagesProps {
  units: Concept[];
  doseForms: Concept[];
  brandProducts: Concept[];
  ingredients: Concept[];
  containerTypes: Concept[];
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
}

function ContainedPackages(props: ContainedPackagesProps) {
  const {
    units,
    doseForms,
    brandProducts,
    ingredients,
    containerTypes,
    control,
    register,
    packageFields,
    packageRemove,
    packageAppend,
    setActivePackageTabIndex,
    activePackageTabIndex,
  } = props;

  const [modalOpen, setModalOpen] = useState(false);
  const [defaultUnit] = useState(getDefaultUnit(units));

  const handleToggleModal = () => {
    setModalOpen(!modalOpen);
  };

  const [disabled, setDisabled] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState(-1);

  const handleDeletePackage = () => {
    // arrayHelpers.remove(indexToDelete);
    packageRemove(indexToDelete);
    setDeleteModalOpen(false);
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setActivePackageTabIndex(newValue);
  };

  const handlePackageCreation = () => {
    packageAppend(defaultPackage(defaultUnit as Concept));
    setActivePackageTabIndex(packageFields.length);
  };

  const handleSearchAndAddPackage = () => {
    handleToggleModal();
    setActivePackageTabIndex(packageFields.length);
  };

  return (
    <>
      <Level1Box component="fieldset">
        <legend>Contained Packages</legend>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
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
            <Tab
              icon={
                <Tooltip title="Create new package">
                  <AddCircle />
                </Tooltip>
              }
              onClick={handlePackageCreation}
              {...a11yProps(
                packageFields.length ? packageFields.length + 1 : 0,
              )}
              key={packageFields.length ? packageFields.length + 1 : 0}
            />
            <Tab
              label={
                <Tooltip title="Search and add an existing package">
                  <span>
                    <SearchAndAddIcon width={'20px'} />
                  </span>
                </Tooltip>
              }
              onClick={handleSearchAndAddPackage}
              {...a11yProps(
                packageFields.length ? packageFields.length + 2 : 1,
              )}
              key={packageFields.length ? packageFields.length + 2 : 1}
            />
          </Tabs>
          <PackageSearchAndAddModal
            open={modalOpen}
            handleClose={handleToggleModal}
            packageAppend={packageAppend}
            defaultUnit={defaultUnit as Concept}
          />
        </Box>
        {packageFields.map((containedPackage, index) => (
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
                    containedPackage.packageDetails.productName as Concept,
                  )
                    ? containedPackage.packageDetails.productName?.pt.term
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
                    <ProductAutocomplete
                      optionValues={brandProducts}
                      searchType={ConceptSearchType.brandProducts}
                      name={`containedPackages[${index}].packageDetails.productName`}
                      control={control}
                    />
                  </InnerBox>
                </Grid>

                <Grid item xs={4}>
                  <InnerBox component="fieldset">
                    <legend>Container Type</legend>
                    <ProductAutocomplete
                      optionValues={containerTypes}
                      searchType={ConceptSearchType.containerTypes}
                      name={`containedPackages[${index}].packageDetails.containerType`}
                      control={control}
                    />
                  </InnerBox>
                </Grid>
                <Grid item xs={3}>
                  <InnerBox component="fieldset">
                    <legend>ARTG ID</legend>
                    <ArtgAutoComplete
                      control={control}
                      name={`containedPackages[${index}].packageDetails.externalIdentifiers`}
                      register={register}
                      optionValues={[]}
                    />
                  </InnerBox>
                </Grid>
              </Stack>

              <InnerBox component="fieldset">
                <legend>Quantity</legend>

                <Stack direction="row" spacing={1} alignItems={'center'}>
                  <Grid item xs={1}>
                    <TextField
                      {...register(
                        `containedPackages.[${index}].value` as 'containedPackages.0.value',
                      )}
                      fullWidth
                      variant="outlined"
                      margin="dense"
                      value={containedPackage.value || 1}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <ProductAutocomplete
                      optionValues={units}
                      searchType={ConceptSearchType.units}
                      name={`containedPackages[${index}].unit`}
                      control={control}
                    />
                  </Grid>
                </Stack>
              </InnerBox>
            </Level2Box>
            <br />
            <ContainedProducts
              showTPU={true}
              partOfPackage={true}
              packageIndex={index}
              units={units}
              doseForms={doseForms}
              brandProducts={brandProducts}
              ingredients={ingredients}
              control={control}
              register={register}
            />
          </CustomTabPanel>
        ))}
      </Level1Box>
    </>
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
        isValidConceptName(packageName.productName as Concept)
          ? packageName.productName?.pt.term
          : 'untitled*'
      }
    >
      <span>
        {isValidConceptName(packageName.productName as Concept)
          ? packageName.productName?.pt.term
          : 'untitled*'}
      </span>
    </Tooltip>
  );
}
export default ContainedPackages;
