import { Box, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Concept, ProductSummary } from '../../types/concept.ts';
import {
  cleanBrandPackSizeDetails,
  cleanDevicePackageDetails,
  cleanPackageDetails,
  cleanProductSummary,
  containsNewConcept,
  getProductDisplayName,
  getSemanticTagChanges,
  isDeviceType,
  trimIfTooLong,
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
  extractSemanticTag,
  getProductViewUrl,
  invalidateBulkActionQueries,
  invalidateBulkActionQueriesById,
  removeSemanticTagFromTerm,
} from '../../utils/helpers/ProductPreviewUtils.ts';
import { ProductNameOverrideModal } from './components/ProductNameOverrideModal.tsx';
import { useConceptsForReview } from '../../hooks/api/task/useConceptsForReview.js';
import { SemanticTagOverrideModal } from './components/SemanticTagOverrideModal.tsx';
import { cloneDeep } from 'lodash';
import { reattachSemanticTags } from '../../utils/helpers/conceptUtils.ts';
import ConceptService from '../../api/ConceptService.ts';
import ErrorModal from '../../themes/overrides/ErrorModal.tsx';
import { deepClone } from '@mui/x-data-grid/utils/utils';

interface ProductPreviewSaveOrViewModeProps {
  productSaveDetails?: ProductSaveDetails;
  productModelResponse: ProductSummary;
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
  productModelResponse,
  ticket,
}: ProductPreviewSaveOrViewModeProps) {
  const { setSelectedConceptIdentifiers } = useAuthoringStore();
  const productModel = useMemo(() => {
    const nodes = productModelResponse.nodes.map(node => {
      if (node.newConceptDetails?.semanticTag) {
        const semanticTag = node.newConceptDetails.semanticTag;
        if (semanticTag) {
          node.newConceptDetails.semanticTag = semanticTag;
          const termWithoutTag = removeSemanticTagFromTerm(
            node.newConceptDetails?.fullySpecifiedName,
            semanticTag,
          );
          node.newConceptDetails.fullySpecifiedName = termWithoutTag
            ? termWithoutTag
            : '';
        }
      }
      return node;
    });
    productModelResponse.nodes = nodes;
    return productModelResponse;
  }, [productModelResponse]);

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
  useConceptsForReview(branch);
  const [overrideDuplicateProductName, setOverrideDuplicateProductName] =
    useState(false);

  const [duplicateConceptNameError, setDuplicateConceptNameError] =
    useState(false);
  const [
    duplicateConceptNameErrorMessages,
    setDuplicateConceptNameErrorMessages,
  ] = useState<Concept[] | undefined>(undefined);

  const productWithNameAlreadyExists = (
    ticket: Ticket | undefined,
    productSummary: ProductSummary,
    productCreationDetails: ProductSaveDetails | undefined,
  ) => {
    const clonedProductSummary = cloneDeep(productSummary);
    reattachSemanticTags(clonedProductSummary);

    const duplicateName = ticket?.products?.find(product => {
      return (
        product.name === clonedProductSummary.subjects[0].fullySpecifiedName
      );
    });
    return (
      duplicateName !== undefined &&
      (!productCreationDetails?.nameOverride ||
        productCreationDetails?.nameOverride === duplicateName.name)
    );
  };

  const duplicateFsnCheck = async (
    productSummary: ProductSummary | undefined,
  ) => {
    if (!productSummary) {
      return {
        hasDuplicates: false,
        matchingConcepts: [],
      };
    }
    const clonedProductSummary = cloneDeep(productSummary);
    reattachSemanticTags(clonedProductSummary);
    const newConcepts = clonedProductSummary?.nodes
      ?.filter(node => {
        return node.newConceptDetails !== null && !node.originalNode;
      })
      .map(node => {
        return node.newConceptDetails;
      });

    // Array to store matches
    const matchingConcepts: Array<Concept> = [];

    if (newConcepts && newConcepts.length > 0) {
      const conceptSearchPromises = newConcepts.map(async concept => {
        if (concept && concept.fullySpecifiedName) {
          return {
            searchedName: concept.fullySpecifiedName,
            response: await ConceptService.searchConceptNoEcl(
              trimIfTooLong(concept.fullySpecifiedName, 250),
              branch,
              true,
            ),
          };
        }
        return null;
      });

      const conceptSearchResults = await Promise.all(conceptSearchPromises);

      conceptSearchResults.forEach(result => {
        if (!result) return;

        const searchedName = result.searchedName;
        const response = result.response;

        const matches = response.items.filter(
          item => item.fsn && item.fsn.term === searchedName,
        );

        // Add each matching concept to our result array
        matches.forEach(match => {
          matchingConcepts.push(match);
        });
      });
    }

    const uniqueMatchingConcepts = Array.from(
      new Map(
        matchingConcepts.map(concept => [concept.conceptId, concept]),
      ).values(),
    );

    return {
      hasDuplicates: uniqueMatchingConcepts.length > 0,
      matchingConcepts: uniqueMatchingConcepts,
    };
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

  const onSubmit = async (
    data: ProductSummary,
    overrideDuplicateName?: boolean,
  ) => {
    if (errorKey) {
      closeSnackbar(errorKey);
      setErrorKey(undefined);
    }
    setLastValidatedData(data);

    const skipDuplicateNameWarning =
      overrideDuplicateProductName ||
      (typeof overrideDuplicateName === 'boolean' && overrideDuplicateName);

    if (
      productWithNameAlreadyExists(ticket, data, productSaveDetails) &&
      !skipDuplicateNameWarning
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
    const producSummaryClone = deepClone(data) as ProductSummary;
    reattachSemanticTags(producSummaryClone);
    const fsnWarnings = uniqueFsnValidator(producSummaryClone.nodes);
    const ptWarnings = uniquePtValidator(producSummaryClone.nodes);

    let ignoreErrorsOpen = false;
    if (!ignoreErrors && (fsnWarnings || ptWarnings)) {
      setIgnoreErrorsModalOpen(true);
      ignoreErrorsOpen = true;
    }
    if (ignoreErrorsOpen) {
      return;
    }

    void submitData(data);
  };

  const submitData = async (data?: ProductSummary) => {
    const usedData = data ? data : lastValidatedData;
    setLoading(true);
    const duplicateFsn = await duplicateFsnCheck(usedData);

    if (duplicateFsn.hasDuplicates) {
      setLoading(false);
      setDuplicateConceptNameError(true);
      setDuplicateConceptNameErrorMessages(duplicateFsn.matchingConcepts);
      setIgnoreErrors(false);
      return;
    }
    reattachSemanticTags(usedData as ProductSummary);

    const hasUpdatedProperties =
      productModel?.nodes?.filter(subject => {
        return (
          subject.propertyUpdate ||
          subject.statedFormChanged ||
          subject.inferredFormChanged ||
          subject.isModified
        );
      }).length > 0;
    const canSubmitProductUpdate = hasUpdatedProperties || newConceptFound;

    if (
      !readOnlyMode &&
      canSubmitProductUpdate &&
      productSaveDetails &&
      usedData
    ) {
      setForceNavigation(true);
      productSaveDetails.productSummary = usedData;
      setLoading(true);

      if (isDeviceType(selectedProductType)) {
        productSaveDetails.packageDetails = cleanDevicePackageDetails(
          productSaveDetails.packageDetails as DevicePackageDetails,
        );
        productSaveDetails.productSummary = cleanProductSummary(
          productSaveDetails.productSummary,
        );
        productService
          .saveDeviceProduct(productSaveDetails, branch)
          .then(v => {
            if (handleClose) handleClose({}, 'escapeKeyDown');
            setLoading(false);
            setSelectedConceptIdentifiers([]);
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
            setSelectedConceptIdentifiers([]);
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
        <ErrorModal
          open={duplicateConceptNameError}
          handleClose={() => setDuplicateConceptNameError(false)}
          content={
            <>
              <Typography>
                This would create concepts with FSN's that already exist
              </Typography>
              {duplicateConceptNameErrorMessages?.map(concept => {
                return (
                  <Typography>
                    Existing Concept: {concept.idAndFsnTerm}
                  </Typography>
                );
              })}
            </>
          }
        />
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
            setOverrideDuplicateProductName(true);
            setDuplicateNameModalOpen(false);
            if (lastValidatedData) {
              void onSubmit(lastValidatedData, true);
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
            void submitData();
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
