import { ProductSummary } from '../../../types/concept.ts';
import {
  Control,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';

import useCanEditTask from '../../../hooks/useCanEditTask.tsx';
import React, { useMemo, useState } from 'react';
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
import ColorLegend from './ColorLegend.tsx';
import useAuthoringStore from '../../../stores/AuthoringStore.ts';

interface ProductPreviewBodyProps {
  productModel: ProductSummary;
  control: Control<ProductSummary>;
  register: UseFormRegister<ProductSummary>;
  watch: UseFormWatch<ProductSummary>;
  getValues: UseFormGetValues<ProductSummary>;
  readOnlyMode: boolean;
  isSimpleEdit: boolean;
  isProductUpdate: boolean;
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
  isSimpleEdit,
  newConceptFound,
  readOnlyMode,
  handleClose,

  setValue,
  ticket,
  isProductUpdate,
}: ProductPreviewBodyProps) {
  const lableTypesRight = ['TP', 'TPUU', 'TPP'];
  const lableTypesLeft = ['MP', 'MPUU', 'MPP'];
  const lableTypesCentre = ['CTPP'];

  const [activeConcept, setActiveConcept] = useState<string>();
  const [expandedConcepts, setExpandedConcepts] = useState<string[]>([]);
  const [idsWithInvalidName, setIdsWithInvalidName] = useState<string[]>([]);
  const { fieldBindingIsLoading, fieldBindings } = useFieldBindings(branch);

  const allConceptIds = useMemo(() => {
    return productModel.nodes.map(node => node.conceptId);
  }, [productModel.nodes]);

  const areAllExpanded = useMemo(() => {
    return allConceptIds.every(id => expandedConcepts.includes(id));
  }, [allConceptIds, expandedConcepts]);

  const handleToggleAll = () => {
    if (areAllExpanded) {
      // Collapse all
      setExpandedConcepts([]);
      setActiveConcept(undefined);
    } else {
      // Expand all
      setExpandedConcepts(allConceptIds);
    }
  };

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
        <>
          {isRefsetLoading ||
            (fieldBindingIsLoading && (
              <ProductLoader
                message={`Loading box model for [${getProductDisplayName(productModel)}]`}
              />
            ))}

          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleToggleAll}
              data-testid="toggle-all-accordions"
            >
              {areAllExpanded ? 'Collapse All' : 'Expand All'}
            </Button>
          </Box>

          <Grid
            container
            rowSpacing={1}
            columnSpacing={{ xs: 1, sm: 2, md: 3 }}
          >
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
                  isSimpleEdit={isSimpleEdit}
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
                  isSimpleEdit={isSimpleEdit}
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
                    isSimpleEdit={isSimpleEdit}
                    setValue={setValue}
                    ticket={ticket}
                  />
                ) : null;
              })}
            </Grid>
          </Grid>
        </>
      </Box>
      <Stack justifyContent="start">
        <ColorLegend
          showLegend={true}
          readOnly={readOnlyMode || isSimpleEdit}
        />
      </Stack>
      {!readOnlyMode && !isSimpleEdit ? (
        <SubmitPanel
          productModel={productModel}
          idsWithInvalidName={idsWithInvalidName}
          newConceptFound={newConceptFound}
          handleClose={handleClose}
          isProductUpdate={isProductUpdate}
        />
      ) : null}
    </>
  );
}
interface SubmitPanelProps {
  newConceptFound: boolean;
  productModel: ProductSummary;
  idsWithInvalidName: string[];
  isProductUpdate: boolean;
  handleClose?:
    | ((event: object, reason: 'backdropClick' | 'escapeKeyDown') => void)
    | (() => void);
}
function SubmitPanel({
  newConceptFound,
  productModel,
  idsWithInvalidName,
  isProductUpdate,
  handleClose,
}: SubmitPanelProps) {
  const { canEdit, lockDescription } = useCanEditTask();
  const { originalConceptId, setOriginalConceptId, setMode } =
    useAuthoringStore();

  const hasUpdatedProperties =
    productModel?.nodes?.filter(subject => {
      return (
        subject.propertyUpdate ||
        subject.statedFormChanged ||
        subject.inferredFormChanged ||
        subject.isModified
      );
    }).length > 0;

  const canSubmitNonProductUpdates =
    !isProductUpdate &&
    canEdit &&
    newConceptFound &&
    idsWithInvalidName.length === 0;
  const canSubmitProductUpdate =
    isProductUpdate &&
    canEdit &&
    idsWithInvalidName.length === 0 &&
    (hasUpdatedProperties || newConceptFound);
  return (
    <Box m={1} p={1}>
      <Stack spacing={2} direction="row" justifyContent="end">
        <Button
          data-testid={'preview-cancel'}
          variant="contained"
          type="button"
          color="error"
          onClick={() => {
            handleClose && handleClose({}, 'escapeKeyDown');
          }}
        >
          Cancel
        </Button>
        {!isProductUpdate && !canSubmitNonProductUpdates && (
          <Button
            data-testid={'preview-return-update'}
            variant="contained"
            type="button"
            color="secondary"
            onClick={() => {
              if (!originalConceptId) {
                const concept = productModel.subjects?.values().next().value;
                if (concept && concept.conceptId) {
                  setOriginalConceptId(concept.conceptId);
                  setMode('update');
                }
              }
              handleClose && handleClose({}, 'escapeKeyDown');
            }}
          >
            Go back to update mode
          </Button>
        )}

        <UnableToEditTooltip
          canEdit={
            (canEdit && !(!isProductUpdate && !canSubmitNonProductUpdates)) ||
            (isProductUpdate && !canSubmitProductUpdate)
          }
          lockDescription={
            !isProductUpdate && !canSubmitNonProductUpdates
              ? 'Create Disabled: No new concept changes detected.'
              : isProductUpdate && !canSubmitProductUpdate
                ? 'Update Disabled: No changes detected.'
                : lockDescription
          }
        >
          <Button
            variant="contained"
            type="submit"
            color="primary"
            disabled={
              (!isProductUpdate && !canSubmitNonProductUpdates) ||
              (isProductUpdate && !canSubmitProductUpdate)
            }
            data-testid={
              isProductUpdate ? 'update-product-btn' : 'create-product-btn'
            }
          >
            {isProductUpdate ? 'Update' : 'Create'}
          </Button>
        </UnableToEditTooltip>
      </Stack>
    </Box>
  );
}
export default ProductPreviewBody;
