import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { Concept, ProductSummary } from '../../types/concept.ts';
import {
  cleanBrandPackSizeDetails,
  cleanDevicePackageDetails,
  cleanPackageDetails,
  cleanProductSummary,
  containsNewConcept,
  getProductDisplayName,
  isDeviceType,
} from '../../utils/helpers/conceptUtils.ts';
import Loading from '../../components/Loading.tsx';

import { useForm } from 'react-hook-form';

import { useNavigate } from 'react-router-dom';

import {
  ActionType,
  BrandPackSizeCreationDetails,
  BulkProductCreationDetails,
  DevicePackageDetails,
  MedicationPackageDetails,
  ProductActionType,
  ProductSaveDetails,
} from '../../types/product.ts';
import { Ticket } from '../../types/tickets/ticket.ts';
import { lingoErrorHandler } from '../../types/ErrorHandler.ts';

import { useServiceStatus } from '../../hooks/api/useServiceStatus.tsx';
import {
  getTicketBulkProductActionsByTicketIdOptions,
  getTicketProductsByTicketIdOptions,
} from '../../hooks/api/tickets/useTicketById.tsx';
import useAuthoringStore from '../../stores/AuthoringStore.ts';
import {
  uniqueFsnValidator,
  uniquePtValidator,
} from '../../types/productValidations.ts';
import WarningModal from '../../themes/overrides/WarningModal.tsx';
import { closeSnackbar } from 'notistack';
import { validateProductSummaryNodes } from '../../types/productValidationUtils.ts';
import { useQueryClient } from '@tanstack/react-query';

import productService from '../../api/ProductService.ts';
import ProductPreviewBody from './components/ProductPreviewBody.tsx';
import {
  getProductViewUrl,
  invalidateBulkActionQueries,
  invalidateBulkActionQueriesById,
} from '../../utils/helpers/ProductPreviewUtils.ts';
import { ProductNameOverrideModal } from './components/ProductNameOverrideModal.tsx';
import { useConceptsForReview } from '../../hooks/api/task/useConceptsForReview.js';

interface ProductPreviewSaveOrViewModeProps {
  productSaveDetails?: ProductSaveDetails;
  productModel: ProductSummary;
  handleClose?:
    | ((event: object, reason: 'backdropClick' | 'escapeKeyDown') => void)
    | (() => void);
  readOnlyMode: boolean;
  branch: string;
  ticket?: Ticket;
}

function ProductPreviewSaveOrViewMode({
  productSaveDetails,
  handleClose,
  readOnlyMode,
  branch,
  productModel,
  ticket,
}: ProductPreviewSaveOrViewModeProps) {
  const [isLoading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { serviceStatus } = useServiceStatus();
  const newConceptFound =
    !readOnlyMode && productModel.nodes
      ? containsNewConcept(productModel.nodes)
      : false;

  const [ignoreErrors, setIgnoreErrors] = useState(false);
  const [ignoreErrorsModalOpen, setIgnoreErrorsModalOpen] = useState(false);
  const [lastValidatedData, setLastValidatedData] = useState<ProductSummary>();
  const [errorKey, setErrorKey] = useState<string | undefined>();

  const [duplicateNameModalOpen, setDuplicateNameModalOpen] = useState(false);
  const [overrideDuplicateName, setOverrideDuplicateName] = useState(false);
  useConceptsForReview(branch);

  const productWithNameAlreadyExists = (
    ticket: Ticket | undefined,
    productSummary: ProductSummary,
    productCreationDetails: ProductSaveDetails | undefined,
  ) => {
    const duplicateName = ticket?.products?.find(product => {
      return product.name === productSummary.subjects[0].fullySpecifiedName;
    });
    return (
      duplicateName !== undefined &&
      (!productCreationDetails?.nameOverride ||
        productCreationDetails?.nameOverride === duplicateName.name)
    );
  };

  const { register, handleSubmit, reset, control, getValues, setValue, watch } =
    useForm<ProductSummary>({
      defaultValues: {
        nodes: [],
        edges: [],
        subjects: [],
      },
    });

  const { setForceNavigation, selectedProductType, selectedActionType } =
    useAuthoringStore();
  const queryClient = useQueryClient();

  const onSubmit = async (data: ProductSummary) => {
    if (errorKey) {
      closeSnackbar(errorKey);
      setErrorKey(undefined);
    }
    setLastValidatedData(data);
    if (
      productWithNameAlreadyExists(ticket, data, productSaveDetails) &&
      !overrideDuplicateName
    ) {
      setDuplicateNameModalOpen(true);
      return;
    }
    const errKey = await validateProductSummaryNodes(
      data.nodes,
      branch,
      serviceStatus,
    );
    if (errKey) {
      setErrorKey(errKey as string);
      return;
    }
    const fsnWarnings = uniqueFsnValidator(data.nodes);
    const ptWarnings = uniquePtValidator(data.nodes);
    if (!ignoreErrors && (fsnWarnings || ptWarnings)) {
      setIgnoreErrorsModalOpen(true);
      return;
    }

    submitData(data);
  };

  const submitData = (data?: ProductSummary) => {
    const usedData = data ? data : lastValidatedData;

    if (!readOnlyMode && productSaveDetails && usedData) {
      setForceNavigation(true);
      productSaveDetails.productSummary = usedData;
      setLoading(true);

      if (isDeviceType(selectedProductType)) {
        productSaveDetails.packageDetails = cleanDevicePackageDetails(
          productSaveDetails.packageDetails as DevicePackageDetails,
        );
        productService
          .createDeviceProduct(productSaveDetails, branch)
          .then(v => {
            if (handleClose) handleClose({}, 'escapeKeyDown');
            setLoading(false);
            if (ticket) {
              void queryClient.invalidateQueries({
                queryKey: getTicketProductsByTicketIdOptions(
                  ticket.id.toString(),
                ).queryKey,
              });
            }
            // TODO: make this ignore

            navigate(
              `${getProductViewUrl()}/${(v.subjects?.values().next().value as Concept).conceptId}`,
              {
                state: { productModel: v, branch: branch },
              },
            );
          })
          .catch(err => {
            setForceNavigation(false);
            setLoading(false);
            const snackbarKey = lingoErrorHandler(
              err,
              `Product creation failed for [${usedData.subjects?.map(subject => subject?.preferredTerm || '').join(', ')}]`,
              serviceStatus,
            );
            setErrorKey(snackbarKey as string);
          });
      } else if (
        selectedActionType === ActionType.newMedication ||
        selectedActionType === ActionType.newVaccine ||
        selectedActionType === ActionType.newNutritionalProduct
      ) {
        // TODO: Fix these 'clean package details' stuff?
        productSaveDetails.packageDetails = cleanPackageDetails(
          productSaveDetails.packageDetails as MedicationPackageDetails,
        );
        productSaveDetails.productSummary = cleanProductSummary(
          productSaveDetails.productSummary,
        );
        productService
          .saveMedicationProduct(productSaveDetails, branch)
          .then(v => {
            if (handleClose) handleClose({}, 'escapeKeyDown');
            setLoading(false);
            if (ticket) {
              void queryClient.invalidateQueries({
                queryKey: getTicketProductsByTicketIdOptions(
                  ticket.id.toString(),
                ).queryKey,
              });
            }
            invalidateBulkActionQueries();
            // TODO: make this ignore

            navigate(
              `${getProductViewUrl()}/${(v.subjects?.values().next().value as Concept).conceptId}`,
              {
                state: { productModel: v, branch: branch },
              },
            );
          })
          .catch(err => {
            setForceNavigation(false);
            setLoading(false);
            const snackbarKey = lingoErrorHandler(
              err,
              `Product creation failed for [${usedData.subjects?.map(subject => subject?.preferredTerm || '').join(', ')}]`,
              serviceStatus,
            );
            setErrorKey(snackbarKey as string);
          });
      } else {
        const bulkProductCreationDetails = {
          details:
            productSaveDetails.packageDetails as BrandPackSizeCreationDetails,
          productSummary: productSaveDetails.productSummary,
          ticketId: productSaveDetails.ticketId,
        } as BulkProductCreationDetails;
        bulkProductCreationDetails.details = cleanBrandPackSizeDetails(
          bulkProductCreationDetails.details,
        );
        productService
          .createNewMedicationBrandPackSizes(bulkProductCreationDetails, branch)
          .then(v => {
            if (handleClose) handleClose({}, 'escapeKeyDown');
            setLoading(false);
            if (ticket) {
              void queryClient.invalidateQueries({
                queryKey: getTicketBulkProductActionsByTicketIdOptions(
                  ticket.id.toString(),
                ).queryKey,
              });
            }
            invalidateBulkActionQueriesById(
              bulkProductCreationDetails.details.productId,
              branch,
            );
            // TODO: make this ignore
            navigate(
              `${getProductViewUrl()}/${(v.subjects?.values().next().value as Concept).conceptId}`,
              {
                state: { productModel: v, branch: branch },
              },
            );
          })
          .catch(err => {
            setForceNavigation(false);
            setLoading(false);
            const snackbarKey = lingoErrorHandler(
              err,
              `Product creation failed for [${usedData.subjects?.map(subject => subject?.preferredTerm || '').join(', ')}]`,
              serviceStatus,
            );
            setErrorKey(snackbarKey as string);
          });
      }
    }
  };

  useEffect(() => {
    if (productModel) {
      reset(productModel);
    }
  }, [reset, productModel]);

  if (isLoading) {
    return (
      <Loading
        message={`Loading Product [${getProductDisplayName(productModel)}]`}
      />
    );
  } else {
    return (
      <>
        <ProductNameOverrideModal
          saveProduct={() => {
            setDuplicateNameModalOpen(false);
            if (lastValidatedData) {
              void onSubmit(lastValidatedData);
            }
          }}
          productName={lastValidatedData?.subjects[0]?.fullySpecifiedName}
          productCreationDetails={productSaveDetails}
          open={duplicateNameModalOpen}
          ignore={() => {
            setOverrideDuplicateName(true);
            setDuplicateNameModalOpen(false);
            if (lastValidatedData) {
              void onSubmit(lastValidatedData);
            }
          }}
          handleClose={() => {
            setDuplicateNameModalOpen(false);
          }}
        />
        <WarningModal
          open={ignoreErrorsModalOpen}
          content={`At least one FSN or PT is the same as another FSN or PT. Is this correct?`}
          handleClose={() => {
            setIgnoreErrorsModalOpen(false);
          }}
          disabled={false}
          action={'Ignore Duplicates'}
          handleAction={() => {
            setIgnoreErrors(true);
            setIgnoreErrorsModalOpen(false);
            submitData();
          }}
        />
        <Box width={'100%'}>
          <form onSubmit={event => void handleSubmit(onSubmit)(event)}>
            <ProductPreviewBody
              productModel={productModel}
              control={control}
              register={register}
              watch={watch}
              getValues={getValues}
              readOnlyMode={readOnlyMode}
              isSimpleEdit={false}
              newConceptFound={newConceptFound}
              branch={branch}
              handleClose={handleClose}
              setValue={setValue}
              isProductUpdate={
                productSaveDetails?.type === ProductActionType.update
              }
            />
          </form>
        </Box>
      </>
    );
  }
}

export default ProductPreviewSaveOrViewMode;
