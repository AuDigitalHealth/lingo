import { ProductSummary } from '../../../types/concept.ts';
import {
  Control,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';

import useCanEditTask from '../../../hooks/useCanEditTask.tsx';
import React, { useState } from 'react';
import { useFieldBindings } from '../../../hooks/api/useInitializeConfig.tsx';
import { useRefsetMembersByComponentIds } from '../../../hooks/api/refset/useRefsetMembersByComponentIds.tsx';
import { Box, Button, Grid } from '@mui/material';
import ProductTypeGroupPreview from './ProductTypeGroupPreview.tsx';
import {
  filterByLabel,
  getProductDisplayName,
} from '../../../utils/helpers/conceptUtils.ts';
import { Stack } from '@mui/system';
import UnableToEditTooltip from '../../tasks/components/UnableToEditTooltip.tsx';

import { Ticket } from '../../../types/tickets/ticket.ts';
import ProductLoader from './ProductLoader.tsx';

interface ProductPreviewBodyProps {
  productModel: ProductSummary;
  control: Control<ProductSummary>;
  register: UseFormRegister<ProductSummary>;
  watch: UseFormWatch<ProductSummary>;
  getValues: UseFormGetValues<ProductSummary>;
  readOnlyMode: boolean;
  editProduct: boolean;
  newConceptFound: boolean;

  branch: string;
  ticket?: Ticket;
  handleClose?:
    | ((event: object, reason: 'backdropClick' | 'escapeKeyDown') => void)
    | (() => void);
  setValue: UseFormSetValue<ProductSummary>;
}

function ProductPreviewBody({
  productModel,
  control,
  getValues,
  register,
  watch,
  branch,
  editProduct,
  newConceptFound,
  readOnlyMode,
  handleClose,

  setValue,
  ticket,
}: ProductPreviewBodyProps) {
  const lableTypesRight = ['TP', 'TPUU', 'TPP'];
  const lableTypesLeft = ['MP', 'MPUU', 'MPP'];
  const lableTypesCentre = ['CTPP'];

  const [activeConcept, setActiveConcept] = useState<string>();
  const [expandedConcepts, setExpandedConcepts] = useState<string[]>([]);
  const [idsWithInvalidName, setIdsWithInvalidName] = useState<string[]>([]);
  const { fieldBindingIsLoading, fieldBindings } = useFieldBindings(branch);

  const { refsetData, isRefsetLoading } = useRefsetMembersByComponentIds(
    branch,
    productModel.nodes
      .filter(i => parseInt(i.conceptId) > 0)
      .flatMap(i => i.conceptId),
  );

  return (
    <>
      <Box
        sx={{ width: '100%' }}
        id={'product-view'}
        data-testid={'product-view'}
      >
        {isRefsetLoading ||
          (fieldBindingIsLoading && (
            <ProductLoader
              message={`Loading box model for [${getProductDisplayName(productModel)}]`}
            />
          ))}
        <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
          <Grid xs={6} key={'left'} item={true}>
            {lableTypesLeft.map((label, index) => (
              <ProductTypeGroupPreview
                key={`left-${label}-${index}`}
                productLabelItems={filterByLabel(productModel?.nodes, label)}
                label={label}
                control={control}
                productModel={productModel}
                activeConcept={activeConcept}
                setActiveConcept={setActiveConcept}
                expandedConcepts={expandedConcepts}
                setExpandedConcepts={setExpandedConcepts}
                getValues={getValues}
                register={register}
                watch={watch}
                idsWithInvalidName={idsWithInvalidName}
                setIdsWithInvalidName={setIdsWithInvalidName}
                fieldBindings={fieldBindings}
                branch={branch}
                refsetData={refsetData}
                editProduct={editProduct}
                setValue={setValue}
                ticket={ticket}
              />
            ))}
          </Grid>
          <Grid xs={6} key={'right'} item={true}>
            {lableTypesRight.map((label, index) => (
              <ProductTypeGroupPreview
                key={`left-${label}-${index}`}
                productLabelItems={filterByLabel(productModel?.nodes, label)}
                label={label}
                control={control}
                productModel={productModel}
                activeConcept={activeConcept}
                setActiveConcept={setActiveConcept}
                expandedConcepts={expandedConcepts}
                setExpandedConcepts={setExpandedConcepts}
                register={register}
                watch={watch}
                getValues={getValues}
                idsWithInvalidName={idsWithInvalidName}
                setIdsWithInvalidName={setIdsWithInvalidName}
                fieldBindings={fieldBindings}
                branch={branch}
                refsetData={refsetData}
                editProduct={editProduct}
                setValue={setValue}
                ticket={ticket}
              />
            ))}
          </Grid>
          <Grid xs={12} key={'bottom'} item={true}>
            {lableTypesCentre.map((label, index) => {
              const filteredItems = filterByLabel(productModel?.nodes, label);

              // Only render the component if there are items to display
              return filteredItems && filteredItems.length > 0 ? (
                <ProductTypeGroupPreview
                  key={`left-${label}-${index}`}
                  productLabelItems={filteredItems}
                  label={label}
                  control={control}
                  productModel={productModel}
                  activeConcept={activeConcept}
                  setActiveConcept={setActiveConcept}
                  expandedConcepts={expandedConcepts}
                  setExpandedConcepts={setExpandedConcepts}
                  register={register}
                  watch={watch}
                  getValues={getValues}
                  idsWithInvalidName={idsWithInvalidName}
                  setIdsWithInvalidName={setIdsWithInvalidName}
                  fieldBindings={fieldBindings}
                  branch={branch}
                  refsetData={refsetData}
                  editProduct={editProduct}
                  setValue={setValue}
                  ticket={ticket}
                />
              ) : null;
            })}
          </Grid>
        </Grid>
      </Box>
      {!readOnlyMode && !editProduct ? (
        <SubmitPanel
          idsWithInvalidName={idsWithInvalidName}
          newConceptFound={newConceptFound}
          handleClose={handleClose}
        />
      ) : (
        <div />
      )}
    </>
  );
}
interface SubmitPanelProps {
  newConceptFound: boolean;

  idsWithInvalidName: string[];
  handleClose?:
    | ((event: object, reason: 'backdropClick' | 'escapeKeyDown') => void)
    | (() => void);
}
function SubmitPanel({
  newConceptFound,

  idsWithInvalidName,
  handleClose,
}: SubmitPanelProps) {
  const { canEdit, lockDescription } = useCanEditTask();

  return (
    <Box m={1} p={1}>
      <Stack spacing={2} direction="row" justifyContent="end">
        <Button
          data-testid={'preview-cancel'}
          variant="contained"
          type="button"
          color="error"
          onClick={() => handleClose && handleClose({}, 'escapeKeyDown')}
        >
          Cancel
        </Button>
        <UnableToEditTooltip
          canEdit={canEdit}
          lockDescription={lockDescription}
        >
          <Button
            variant="contained"
            type="submit"
            color="primary"
            disabled={
              !newConceptFound || !canEdit || idsWithInvalidName.length > 0
            }
            data-testid={'create-product-btn'}
          >
            Create
          </Button>
        </UnableToEditTooltip>
      </Stack>
    </Box>
  );
}
export default ProductPreviewBody;
