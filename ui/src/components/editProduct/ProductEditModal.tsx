import {
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import BaseModal from '../modal/BaseModal';
import BaseModalBody from '../modal/BaseModalBody';

import BaseModalHeader from '../modal/BaseModalHeader';
import {
  Acceptability,
  CaseSignificance,
  DefinitionType,
  Description,
  Product,
} from '../../types/concept.ts';
import { Box, Stack } from '@mui/system';
import {
  FieldLabelRequired,
  InnerBoxSmall,
} from '../../pages/products/components/style/ProductBoxes.tsx';
import { filterKeypress } from '../../utils/helpers/conceptUtils.ts';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldError,
  useFieldArray,
  useForm,
  useFormState,
} from 'react-hook-form';
import {
  ExternalIdentifier,
  ProductDescriptionUpdateRequest,
  ProductExternalRequesterUpdateRequest,
  ProductUpdateRequest,
} from '../../types/product.ts';
import ArtgAutoComplete from '../../pages/products/components/ArtgAutoComplete.tsx';
import {
  useUpdateProductDescription,
  useUpdateProductExternalIdentifiers,
} from '../../hooks/api/products/useUpdateProductDescription.tsx';
import { Ticket } from '../../types/tickets/ticket.ts';
import { useTheme } from '@mui/material/styles';
import {
  areTwoExternalIdentifierArraysEqual,
  sortExternalIdentifiers,
} from '../../utils/helpers/tickets/additionalFieldsUtils.ts';
import { getSearchConceptsByEclOptions } from '../../hooks/api/useInitializeConcepts.tsx';
import { generateEclFromBinding } from '../../utils/helpers/EclUtils.ts';
import { useFieldBindings } from '../../hooks/api/useInitializeConfig.tsx';
import { useQueryClient } from '@tanstack/react-query';
import {
  extractSemanticTag,
  removeDescriptionSemanticTag,
} from '../../utils/helpers/ProductPreviewUtils.ts';
import { AxiosError } from 'axios';
import { SnowstormError } from '../../types/ErrorHandler.ts';
import { useSearchConceptByIdNoCache } from '../../hooks/api/products/useSearchConcept.tsx';
import { isEqual, cloneDeep } from 'lodash';
import { Add, Delete } from '@mui/icons-material';
import useAvailableProjects, {
  getProjectFromKey,
} from '../../hooks/api/useInitializeProjects.tsx';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore.ts';
import { LanguageRefset } from '../../types/Project.ts';
import ConfirmationModal from '../../themes/overrides/ConfirmationModal.tsx';
import Loading from '../Loading.tsx';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { productUpdateValidationSchema } from '../../types/productValidations.ts';

const USLangRefset: LanguageRefset = {
  default: 'false',
  en: '900000000000509007',
  dialectName: 'US',
  readOnly: 'false',
};

const typeMap: Record<DefinitionType, string> = {
  [DefinitionType.FSN]: '900000000000003001',
  [DefinitionType.SYNONYM]: '900000000000013009',
};

const caseSignificanceDisplay: Record<CaseSignificance, string> = {
  [CaseSignificance.ENTIRE_TERM_CASE_SENSITIVE]: 'CS',
  [CaseSignificance.CASE_INSENSITIVE]: 'ci',
  [CaseSignificance.INITIAL_CHARACTER_CASE_INSENSITIVE]: 'cI',
};

interface ProductEditModalProps {
  open: boolean;
  handleClose: () => void;
  product: Product;
  keepMounted: boolean;
  branch: string;
  ticket: Ticket;
  isCtpp: boolean;
  sevenBoxConceptId?: string;
}

export default function ProductEditModal({
  open,
  handleClose,
  keepMounted,
  product,
  branch,
  ticket,
  isCtpp,
  sevenBoxConceptId,
}: ProductEditModalProps) {
  const closeHandle = () => {
    handleClose();
  };

  return (
    <>
      {open && (
        <BaseModal
          open={open}
          handleClose={closeHandle}
          keepMounted={keepMounted}
          sx={{ width: '80%' }}
        >
          <BaseModalHeader title={'Edit Product'} />
          <BaseModalBody>
            <EditConceptBody
              product={product}
              branch={branch}
              handleClose={handleClose}
              ticket={ticket}
              isCtpp={isCtpp}
              sevenBoxConceptId={sevenBoxConceptId}
            />
          </BaseModalBody>
        </BaseModal>
      )}
    </>
  );
}
interface EditConceptBodyProps {
  product: Product;
  branch: string;
  handleClose: () => void;
  ticket: Ticket;
  isCtpp: boolean;
  sevenBoxConceptId?: string;
}

function EditConceptBody({
  product,
  branch,
  handleClose,
  ticket,
  isCtpp,
  sevenBoxConceptId,
}: EditConceptBodyProps) {
  const { data, isFetching } = useSearchConceptByIdNoCache(
    product.conceptId,
    branch,
  );

  const { data: projects } = useAvailableProjects();
  const { applicationConfig } = useApplicationConfigStore();
  const project = getProjectFromKey(applicationConfig?.apProjectKey, projects);

  const [displayRetiredDescriptions, setDisplayRetiredDescriptions] =
    useState(false);

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);

  const langRefsets = useMemo(() => {
    if (project === undefined || project.metadata === undefined) {
      return [];
    }
    const fromApi = [...project.metadata.requiredLanguageRefsets];
    fromApi.push(USLangRefset);
    return fromApi;
  }, [project]);

  const descriptions = useMemo(() => {
    const existingDescriptions = data?.descriptions ? data.descriptions : [];
    return existingDescriptions;
  }, [data?.descriptions]);

  const [artgOptVals, setArtgOptVals] = useState<ExternalIdentifier[]>(
    product.externalIdentifiers ? product.externalIdentifiers : [],
  );

  const defaultLangRefset = langRefsets.find(langRefsets => {
    return langRefsets.default === 'true';
  });

  const isPreferredTerm = (description: Description): boolean => {
    if (!description) {
      return false;
    }
    return (
      description.type === 'SYNONYM' &&
      defaultLangRefset !== undefined &&
      description.acceptabilityMap?.[defaultLangRefset.en] === 'PREFERRED'
    );
  };

  const sortedDescriptions = useMemo(() => {
    if (!descriptions) return [];

    const fsn = descriptions.find(d => {
      return d.type === 'FSN' && d.active === true;
    });
    const preferredSynonym = descriptions.find(isPreferredTerm);
    const otherSynonyms = descriptions.filter(
      d => d.type === 'SYNONYM' && d !== preferredSynonym,
    );

    const tempDescriptions = [
      ...(fsn ? [fsn] : []),
      ...(preferredSynonym ? [preferredSynonym] : []),
      ...otherSynonyms,
    ];
    return tempDescriptions;
    // eslint-disable-next-line
  }, [descriptions, defaultLangRefset]);

  const sortedDescriptionsWithoutSemanticTags = useMemo(() => {
    return sortedDescriptions.map(desc => {
      return removeDescriptionSemanticTag(desc);
    });
  }, [sortedDescriptions]);

  const { fieldBindings } = useFieldBindings(branch);

  const ctppSearchEcl = generateEclFromBinding(fieldBindings, 'product.search');

  const defaultValues = useMemo(() => {
    return {
      externalRequesterUpdate: {
        externalIdentifiers: product.externalIdentifiers
          ? sortExternalIdentifiers(product.externalIdentifiers)
          : [],
        ticketId: ticket.id,
      },
      descriptionUpdate: {
        descriptions: descriptions,
        ticketId: ticket.id,
      },
    } as ProductUpdateRequest;
  }, [product, ticket, descriptions]);

  const {
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors },
    getValues,
    setValue,
    watch,
    trigger,
  } = useForm<ProductUpdateRequest>({
    mode: 'all',
    reValidateMode: 'onChange',
    criteriaMode: 'all',
    defaultValues,
    resolver: yupResolver(productUpdateValidationSchema),
  });

  useEffect(() => {
    // eslint-disable-next-line
    const subscription = watch((value, { name, type }) => {
      if (name?.includes('term')) return;
      void trigger();
    });

    return () => subscription.unsubscribe();
  }, [watch, trigger]);

  const { fields, append } = useFieldArray({
    control,
    name: 'descriptionUpdate.descriptions',
  });

  useEffect(() => {
    if (fields.length === 0 && sortedDescriptions.length > 0) {
      setValue('descriptionUpdate.descriptions', sortedDescriptions);
    }
  }, [sortedDescriptions, setValue, fields.length]);

  useEffect(() => {
    const currentDescriptions = getValues('descriptionUpdate.descriptions');
    if (
      sortedDescriptionsWithoutSemanticTags.length > 0 &&
      !isEqual(currentDescriptions, sortedDescriptionsWithoutSemanticTags)
    ) {
      reset({
        ...defaultValues,
        descriptionUpdate: {
          ...defaultValues.descriptionUpdate,
          descriptions: sortedDescriptionsWithoutSemanticTags,
        },
      });
    }
    // eslint-disable-next-line
  }, [sortedDescriptionsWithoutSemanticTags, reset, getValues]);

  const theme = useTheme();
  const updateProductDescriptionMutation = useUpdateProductDescription();
  const updateProductExternalIdentifierMutation =
    useUpdateProductExternalIdentifiers();

  const { isPending, data: updateProductDescriptionData } =
    updateProductDescriptionMutation;
  const {
    isPending: isExternalIdentifiersPending,
    data: updateExternalIdentifierData,
  } = updateProductExternalIdentifierMutation;

  const isUpdating = isPending || isExternalIdentifiersPending;

  useEffect(() => {
    if (
      !isUpdating &&
      (updateProductDescriptionData || updateExternalIdentifierData)
    ) {
      reset();
      handleClose();
    }
  }, [
    reset,
    handleClose,
    isUpdating,
    updateProductDescriptionData,
    isExternalIdentifiersPending,
    updateExternalIdentifierData,
  ]);

  const formSubmissionData = useRef<ProductUpdateRequest | null>(null);

  const onSubmit = (data: ProductUpdateRequest) => {
    if (!isCtpp) {
      setConfirmationModalOpen(true);
      formSubmissionData.current = data;
      return;
    } else {
      void updateProduct(data);
    }
  };

  const queryClient = useQueryClient();

  const updateDescription = (request: ProductDescriptionUpdateRequest) => {
    const productId = product.conceptId;
    updateProductDescriptionMutation.mutate(
      {
        productDescriptionUpdateRequest: cloneDeep(request),
        productId: productId,
        branch: branch,
      },
      {
        onSuccess: () => {
          const queryKey = getSearchConceptsByEclOptions(
            descriptions.find(d => d.type === 'FSN')?.term as string,
            ctppSearchEcl,
            branch,
            false,
            undefined,
            true,
          ).queryKey;
          void queryClient.invalidateQueries({ queryKey: queryKey });

          const queryKeyConceptModel = `concept-model-${branch}-${sevenBoxConceptId}`;
          void queryClient.refetchQueries({ queryKey: [queryKeyConceptModel] });
          enqueueSnackbar('Product edited successfully.', {
            variant: 'success',
          });
          formSubmissionData.current = null;
        },
      },
    );
  };

  const updateArtgIds = (
    externalRequesterUpdate: ProductExternalRequesterUpdateRequest,
    productId: string,
    ticketId: number,
  ) => {
    externalRequesterUpdate.ticketId = ticketId;
    return new Promise<void>((resolve, reject) => {
      updateProductExternalIdentifierMutation.mutate(
        { externalRequesterUpdate, productId, branch },
        {
          onSuccess: result => {
            product.externalIdentifiers = result;
            resolve();
          },
          onError: reject,
        },
      );
    });
  };

  /**
   * Handling sequential call. Snowstorm is throwing error simultaneously updating artg id and product descriptions
   * @param data
   */
  const updateProduct = async (data: ProductUpdateRequest) => {
    const productId = product.conceptId;
    const newFsnIndex = data.descriptionUpdate?.descriptions?.findIndex(
      description => {
        return description.type === 'FSN' && description.active === true;
      },
    );

    const readOnlyLangRefsetsIds = langRefsets
      .filter(langRefset => {
        return langRefset.readOnly === 'true';
      })
      .map(langRefset => langRefset.en);

    // remove the "NOT ACCEPTABLE"
    data.descriptionUpdate.descriptions?.forEach(description => {
      if (description.acceptabilityMap) {
        Object.keys(description.acceptabilityMap).forEach(key => {
          if (
            readOnlyLangRefsetsIds.includes(key) &&
            description.acceptabilityMap
          ) {
            delete description.acceptabilityMap[key];
          }
        });
      }
    });

    if (data.descriptionUpdate) {
      data.descriptionUpdate.descriptions = processDescriptionsWithSemanticTags(
        data.descriptionUpdate?.descriptions,
        sortedDescriptions,
      );
    }

    if (data.descriptionUpdate) {
      data.descriptionUpdate.descriptions =
        data.descriptionUpdate.descriptions?.map(desc => {
          return removeNotAcceptable(desc);
        });

      data.descriptionUpdate.descriptions =
        data.descriptionUpdate.descriptions?.map(desc => {
          return adjustTypeIds(desc);
        });
    }

    const anyDescriptionModified = !isEqual(
      sortedDescriptions,
      data.descriptionUpdate?.descriptions,
    );

    const artgModified = !areTwoExternalIdentifierArraysEqual(
      data.externalRequesterUpdate.externalIdentifiers,
      product.externalIdentifiers ? product.externalIdentifiers : [],
    );

    try {
      if (artgModified && anyDescriptionModified) {
        void (await updateArtgIds(
          data.externalRequesterUpdate,
          productId,
          ticket.id,
        ));
        updateDescription(data.descriptionUpdate);
      } else if (artgModified) {
        void (await updateArtgIds(
          data.externalRequesterUpdate,
          productId,
          ticket.id,
        ));
      } else if (anyDescriptionModified) {
        updateDescription(data.descriptionUpdate);
      }
    } catch (error) {
      const err = error as AxiosError<SnowstormError>;
      if (
        err.response?.data.detail.includes(
          'already exists. Cannot create a new concept with the same name.',
        )
      ) {
        setError(`descriptionUpdate.descriptions.${newFsnIndex}.term`, {
          type: 'manual',
          message: 'This name already exists!',
        });
      }
    }
  };
  const resetAndClose = () => {
    setArtgOptVals(
      product.externalIdentifiers ? product.externalIdentifiers : [],
    );
    reset(defaultValues);

    handleClose();
  };

  const toggleDisplayRetiredDescriptions = () => {
    setDisplayRetiredDescriptions(!displayRetiredDescriptions);
  };

  const handleAddDescription = () => {
    const tempDescription = createDefaultDescription(
      product.conceptId,
      '900000000000013009',
      defaultLangRefset?.en,
    );

    tempDescription.acceptabilityMap = langRefsets.reduce(
      (acc, langRefset) => {
        acc[langRefset.en] = 'NOT ACCEPTABLE' as Acceptability; // Use langRefset.en as the key
        return acc;
      },
      {} as Record<string, Acceptability>,
    );
    append(tempDescription);
  };

  const handleDeleteDescription = (index: number) => {
    const updatedDescriptions = getValues('descriptionUpdate.descriptions');
    if (updatedDescriptions) {
      updatedDescriptions.splice(index, 1);
      setValue('descriptionUpdate.descriptions', updatedDescriptions, {
        shouldDirty: true,
      });
    }
  };

  const handleCloseModal = () => {
    setConfirmationModalOpen(false);
  };

  const handleConfirmAction = () => {
    setConfirmationModalOpen(false);
    const dataToSubmit = formSubmissionData.current;
    if (dataToSubmit) {
      void updateProduct(dataToSubmit);
    }
  };

  return (
    <>
      <Box
        sx={{
          width: '100%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Grid
          container
          direction="row"
          spacing={3}
          paddingTop={2}
          paddingBottom={3}
          alignItems="start"
        >
          {/* Main Content */}
          <Grid item xs={12}>
            <Grid container spacing={2} sx={{ width: '100%' }} paddingLeft={2}>
              {/* Wrapper for Left and Right Sections */}
              <Grid
                item
                container
                xs={12}
                sx={{
                  display: 'flex',
                  alignItems: 'stretch', // Ensures both sections stretch equally
                }}
              >
                {/* Left Section */}
                <LeftSection
                  displayRetiredDescriptions={displayRetiredDescriptions}
                  isFetching={isFetching}
                  product={product}
                  descriptions={sortedDescriptions}
                  isCtpp={isCtpp}
                  dialects={langRefsets}
                />
                <Grid
                  item
                  xs={6}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    paddingLeft: 1,
                    position: 'relative',
                  }}
                >
                  <Typography variant="h6" marginBottom={1}>
                    New
                  </Typography>
                  <Box
                    border={0.1}
                    borderColor="grey.200"
                    padding={2}
                    sx={{
                      height: '100%',
                      width: '100%',
                      flexGrow: 1,
                    }}
                  >
                    <form
                      onSubmit={event => void handleSubmit(onSubmit)(event)}
                    >
                      <ConfirmationModal
                        keepMounted={true}
                        open={confirmationModalOpen}
                        content={
                          'Any Changes to the FSN or PT will not cascade to any other products that use this concept. Is that okay?'
                        }
                        handleClose={handleCloseModal}
                        title={'Confirm Change'}
                        action={'Confirm'}
                        handleAction={handleConfirmAction}
                      />
                      <RightSection
                        isFetching={isFetching}
                        fields={fields}
                        displayRetiredDescriptions={displayRetiredDescriptions}
                        sortedDescriptions={sortedDescriptions}
                        sortedDescriptionsWithoutSemanticTags={
                          sortedDescriptionsWithoutSemanticTags
                        }
                        handleDeleteDescription={handleDeleteDescription}
                        isUpdating={isUpdating}
                        langRefsets={langRefsets}
                        control={control}
                        handleAddDescription={handleAddDescription}
                        isPreferredTerm={isPreferredTerm}
                      />
                      {isCtpp && (
                        <Grid>
                          <InnerBoxSmall component="fieldset">
                            <legend>Artg Ids</legend>
                            <Grid paddingTop={1}></Grid>
                            <ArtgAutoComplete
                              disabled={isUpdating}
                              name="externalRequesterUpdate.externalIdentifiers"
                              control={control}
                              error={
                                errors?.externalRequesterUpdate
                                  ?.externalIdentifiers as FieldError
                              }
                              dataTestId="package-brand"
                              optionValues={[]}
                              handleChange={(
                                artgs: ExternalIdentifier[] | null,
                              ) => {
                                setArtgOptVals(artgs ? artgs : []);
                              }}
                            />
                            {artgOptVals.length === 0 &&
                              product.externalIdentifiers &&
                              product.externalIdentifiers?.length > 0 && (
                                <Box style={{ marginBottom: '-2' }}>
                                  <span
                                    style={{
                                      color: `${theme.palette.warning.darker}`,
                                    }}
                                  >
                                    Warning!: This will remove all the artg ids{' '}
                                  </span>
                                </Box>
                              )}
                          </InnerBoxSmall>
                        </Grid>
                      )}
                      <ActionButton
                        control={control}
                        resetAndClose={resetAndClose}
                        isSubmitting={isUpdating}
                        toggleDisplayRetiredDescriptions={
                          toggleDisplayRetiredDescriptions
                        }
                        displayRetiredDescriptions={displayRetiredDescriptions}
                      />
                    </form>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* Buttons - Positioned at the Right Bottom */}
        </Grid>
      </Box>
    </>
  );
}
interface LeftSectionProps {
  displayRetiredDescriptions: boolean;
  isFetching: boolean;
  product: Product;
  descriptions: Description[];
  isCtpp: boolean;
  dialects: LanguageRefset[];
}

function LeftSection({
  displayRetiredDescriptions,
  isFetching,
  product,
  descriptions,
  isCtpp,
  dialects,
}: LeftSectionProps) {
  // Function to determine preferred term based on AU dialect
  const isPreferredTerm = (description: Description): boolean => {
    const defaultDialectKey = dialects.find(langRefsets => {
      return langRefsets.default === 'true';
    });
    return (
      description.type === 'SYNONYM' &&
      defaultDialectKey !== undefined &&
      description.acceptabilityMap?.[defaultDialectKey.en] === 'PREFERRED'
    );
  };

  return (
    <Grid
      item
      xs={6}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        paddingRight: 1, // Add padding to separate from right section
      }}
    >
      <Typography variant="h6" marginBottom={1}>
        Existing
      </Typography>
      <Box
        border={0.1}
        borderColor="grey.200"
        padding={2}
        sx={{
          height: '100%',
          width: '100%',
          flexGrow: 1, // Ensures the height matches the right section
        }}
      >
        {/* FSN and Synonyms Section */}
        <InnerBoxSmall component="fieldset">
          {isFetching && <Loading />}
          {!isFetching && (
            <>
              {descriptions.map((description, index) => {
                const isPreferred = isPreferredTerm(description);
                const label =
                  description.type === 'FSN'
                    ? 'FSN'
                    : isPreferred
                      ? 'Preferred Term'
                      : 'Synonym';
                if (!displayRetiredDescriptions && !description.active) {
                  return <></>;
                }
                return (
                  <Grid
                    container
                    spacing={1}
                    key={`${description.descriptionId}-left`}
                    alignItems="center"
                  >
                    <Grid item xs={12} md={2}>
                      {/* <Typography variant="subtitle2">{label}</Typography> */}
                      <FormControl fullWidth margin="dense" size="small">
                        <InputLabel>Type</InputLabel>
                        <Select
                          // fullWidth
                          // variant="standard"
                          margin="dense"
                          value={description.type}
                          disabled
                        >
                          {Object.values(DefinitionType).map(
                            (value: string) => (
                              <MenuItem key={value} value={value}>
                                {value}
                              </MenuItem>
                            ),
                          )}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <Typography variant="subtitle2">{label}</Typography>
                      <TextField
                        fullWidth
                        variant="outlined"
                        margin="dense"
                        multiline
                        minRows={1}
                        maxRows={4}
                        value={description.term || ''}
                        disabled
                      />
                    </Grid>
                    {/* Display Dialect Acceptability */}
                    <Grid item xs={12} md={3}>
                      <Grid container direction="column" spacing={1}>
                        {dialects.map(dialect => (
                          <Grid item xs={12} md={2.5} key={dialect.en}>
                            <FormControl fullWidth margin="dense" size="small">
                              <InputLabel>{dialect.dialectName}</InputLabel>
                              <Select
                                disabled
                                defaultValue={() => {
                                  return (
                                    descriptions[index]?.acceptabilityMap?.[
                                      dialect.en
                                    ] || 'NOT ACCEPTABLE'
                                  );
                                }}
                              >
                                {['PREFERRED', 'ACCEPTABLE'].map(
                                  (value: string) => (
                                    <MenuItem key={value} value={value}>
                                      {value}
                                    </MenuItem>
                                  ),
                                )}
                                <MenuItem value={'NOT ACCEPTABLE'}>
                                  NOT ACCEPTABLE
                                </MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth margin="dense" size="small">
                        <InputLabel>Case Sensitivity</InputLabel>

                        <Select
                          disabled={true}
                          value={description.caseSignificance}
                        >
                          {Object.values(CaseSignificance).map(value => (
                            <MenuItem key={value} value={value}>
                              {value}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Divider sx={{ width: '100%', my: 1 }} />
                  </Grid>
                );
              })}
            </>
          )}
        </InnerBoxSmall>

        {/* Artg Ids Section */}
        {isCtpp && (
          <Grid>
            <InnerBoxSmall component="fieldset">
              <legend>Artg Ids</legend>
              <TextField
                fullWidth
                variant="outlined"
                margin="dense"
                InputLabelProps={{ shrink: true }}
                onKeyDown={filterKeypress}
                value={
                  (product.externalIdentifiers
                    ? sortExternalIdentifiers(product.externalIdentifiers)
                        .map(artg => artg.identifierValue)
                        .join(', ')
                    : '') || ''
                }
                disabled
              />
            </InnerBoxSmall>
          </Grid>
        )}
      </Box>
    </Grid>
  );
}

interface RightSectionProps {
  isFetching: boolean;
  fields: FieldArrayWithId<
    ProductUpdateRequest,
    'descriptionUpdate.descriptions',
    'id'
  >[];
  displayRetiredDescriptions: boolean;
  sortedDescriptions: Description[];
  sortedDescriptionsWithoutSemanticTags: Description[];
  handleDeleteDescription: (index: number) => void;
  isUpdating: boolean;
  isPreferredTerm: (desc: Description) => boolean;
  langRefsets: LanguageRefset[];
  control: Control<ProductUpdateRequest>;
  handleAddDescription: React.MouseEventHandler<HTMLButtonElement> | undefined;
}

function RightSection({
  isFetching,
  fields,
  displayRetiredDescriptions,
  sortedDescriptions,
  sortedDescriptionsWithoutSemanticTags,
  handleDeleteDescription,
  isUpdating,
  isPreferredTerm,
  langRefsets,
  control,
  handleAddDescription,
}: RightSectionProps) {
  return (
    <>
      <InnerBoxSmall component="fieldset">
        <FieldLabelRequired>FSN</FieldLabelRequired>
        {/* {!isLoading && */}
        {isFetching && <Loading />}
        {!isFetching &&
          fields.map((field, index) => {
            return (
              <FieldDescriptions
                key={index}
                displayRetiredDescriptions={displayRetiredDescriptions}
                field={field}
                sortedDescriptionsWithSemanticTag={sortedDescriptions}
                sortedDescriptionsWithoutSemanticTag={
                  sortedDescriptionsWithoutSemanticTags
                }
                index={index}
                handleDeleteDescription={handleDeleteDescription}
                isPreferredTerm={isPreferredTerm}
                langRefsets={langRefsets}
                control={control}
                disabled={isUpdating}
              />
            );
          })}
      </InnerBoxSmall>
      <IconButton
        onClick={handleAddDescription}
        aria-label="add description"
        disabled={isUpdating}
      >
        <Add />
      </IconButton>
    </>
  );
}

interface ActionButtonProps {
  control: Control<ProductUpdateRequest>;
  resetAndClose: () => void;
  isSubmitting: boolean;
  toggleDisplayRetiredDescriptions: () => void;
  displayRetiredDescriptions: boolean;
}
function ActionButton({
  control,
  resetAndClose,
  isSubmitting,
  toggleDisplayRetiredDescriptions,
  displayRetiredDescriptions,
}: ActionButtonProps) {
  const { dirtyFields, errors } = useFormState({ control });
  const hasErrors = Object.keys(errors).length > 0;
  const isDirty = Object.keys(dirtyFields).length > 0;

  const isButtonDisabled = () => isSubmitting || !isDirty || hasErrors;
  return (
    <Grid
      item
      xs={12}
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        paddingTop: 2,
        marginLeft: -2,
      }}
    >
      <Stack direction="row" spacing={2}>
        <FormControlLabel
          control={
            <Switch
              color="primary"
              checked={displayRetiredDescriptions}
              onChange={() => {
                toggleDisplayRetiredDescriptions();
              }}
              disabled={isSubmitting}
            />
          }
          label="Display Retired Descriptions"
          labelPlacement="start"
          sx={{
            '& .MuiSwitch-root': {
              padding: 0,
            },
          }}
        />
        <Button
          variant="contained"
          type="button"
          color="error"
          onClick={() => {
            resetAndClose();
          }}
          disabled={isSubmitting}
          sx={{
            '&.Mui-disabled': {
              color: '#696969',
            },
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          type="submit"
          color="primary"
          disabled={isButtonDisabled()}
          data-testid={'edit-product-btn'}
          sx={{
            '&.Mui-disabled': {
              color: '#696969',
            },
          }}
        >
          {isSubmitting ? 'Updating...' : 'Update'}
        </Button>
      </Stack>
    </Grid>
  );
}

const createDefaultDescription = (
  conceptId: string,
  typeId: string,
  moduleId: string | undefined,
): Description => {
  return {
    active: true,
    moduleId: moduleId ? moduleId : '',
    released: false,
    descriptionId: undefined,
    term: '',
    conceptId: conceptId,
    typeId: typeId,
    acceptabilityMap: undefined,
    type: DefinitionType.SYNONYM,
    lang: 'en',
    caseSignificance: CaseSignificance.ENTIRE_TERM_CASE_SENSITIVE,
  };
};

interface FieldDescriptionsProps {
  displayRetiredDescriptions: boolean;
  sortedDescriptionsWithoutSemanticTag: Description[];
  sortedDescriptionsWithSemanticTag: Description[];
  index: number;
  isPreferredTerm: (desc: Description) => boolean;
  handleDeleteDescription: (index: number) => void;
  langRefsets: LanguageRefset[];
  field: FieldArrayWithId<
    ProductUpdateRequest,
    'descriptionUpdate.descriptions',
    'id'
  >;
  control: Control<ProductUpdateRequest>;
  disabled: boolean;
}
const FieldDescriptions = ({
  displayRetiredDescriptions,
  sortedDescriptionsWithoutSemanticTag,
  sortedDescriptionsWithSemanticTag,
  index,
  isPreferredTerm,
  handleDeleteDescription,
  langRefsets,
  field,
  control,
  disabled,
}: FieldDescriptionsProps) => {
  const description = sortedDescriptionsWithoutSemanticTag[index] as
    | Description
    | undefined;
  const descriptionWithSemanticTag = sortedDescriptionsWithSemanticTag[
    index
  ] as Description | undefined;

  const containsSemanticTag = extractSemanticTag(
    descriptionWithSemanticTag?.term,
  )
    ?.trim()
    .toLocaleLowerCase();

  const descriptionType = sortedDescriptionsWithoutSemanticTag[index]?.type;
  const isPreferred = isPreferredTerm(
    sortedDescriptionsWithoutSemanticTag[index],
  );
  const label =
    descriptionType === 'FSN'
      ? 'FSN'
      : isPreferred
        ? 'Preferred Term'
        : 'Synonym';

  if (!displayRetiredDescriptions && description && !description.active) {
    return <></>;
  }
  return (
    <Grid container spacing={1} key={field.id} alignItems="center">
      <Grid item xs={12} md={2}>
        <Controller
          name={`descriptionUpdate.descriptions.${index}.type`}
          control={control}
          render={({ field: controllerField, fieldState }) => {
            return (
              <FormControl
                fullWidth
                margin="dense"
                size="small"
                error={!!fieldState.error}
              >
                <InputLabel>Type</InputLabel>
                <Select {...controllerField} margin="dense" disabled={disabled}>
                  {['FSN', 'SYNONYM'].map((value: string) => (
                    <MenuItem key={value} value={value}>
                      {value}
                    </MenuItem>
                  ))}
                </Select>
                {fieldState.error && (
                  <FormHelperText>{fieldState.error.message}</FormHelperText>
                )}
              </FormControl>
            );
          }}
        />
      </Grid>
      <Grid item xs={12} md={4.5}>
        <Controller
          name={`descriptionUpdate.descriptions.${index}.active`}
          control={control}
          render={({ field: controllerField }) => {
            return (
              <Switch
                {...controllerField}
                disabled={disabled}
                checked={controllerField.value}
                onChange={e => {
                  controllerField.onChange(e.target.checked);
                }}
                color="primary"
                size="small"
              />
            );
          }}
        />
        <Controller
          name={`descriptionUpdate.descriptions.${index}.term`}
          control={control}
          render={({ field: controllerField, fieldState }) => {
            return (
              <TextField
                {...controllerField}
                label={`${label}`}
                fullWidth
                margin="dense"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                multiline
                minRows={1}
                maxRows={4}
                disabled={disabled}
              />
            );
          }}
        />
        {/* Display Semantic Tag if available */}
        {containsSemanticTag && (
          <Typography
            variant="caption"
            color="textSecondary"
            style={{ marginTop: '4px' }}
          >
            Semantic Tag: {containsSemanticTag}
          </Typography>
        )}
      </Grid>

      <Grid item xs={12} md={3}>
        <Grid container direction="column" spacing={1}>
          {langRefsets.map(dialect => {
            return (
              <Grid item key={dialect.dialectName}>
                <Controller
                  name={`descriptionUpdate.descriptions.${index}.acceptabilityMap.${dialect.en}`}
                  control={control}
                  defaultValue={
                    sortedDescriptionsWithoutSemanticTag[index]
                      ?.acceptabilityMap?.[dialect.en] ||
                    ('NOT ACCEPTABLE' as Acceptability)
                  }
                  render={({ field: controllerField, fieldState }) => {
                    return (
                      <>
                        <FormControl
                          fullWidth
                          margin="dense"
                          size="small"
                          error={!!fieldState.error}
                        >
                          <InputLabel>{dialect.dialectName}</InputLabel>
                          <Select
                            {...controllerField}
                            disabled={
                              disabled ||
                              dialect.dialectName.toLowerCase() === 'en-gb'
                            }
                            error={!!fieldState.error}
                          >
                            {['PREFERRED', 'ACCEPTABLE'].map(
                              (value: string) => (
                                <MenuItem key={value} value={value}>
                                  {value}
                                </MenuItem>
                              ),
                            )}
                            <MenuItem value={'NOT ACCEPTABLE'}>
                              NOT ACCEPTABLE
                            </MenuItem>
                          </Select>
                          {fieldState.error && (
                            <FormHelperText>
                              {fieldState.error.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </>
                    );
                  }}
                />
              </Grid>
            );
          })}
        </Grid>
      </Grid>
      <Grid item xs={12} md={1.5}>
        <FormControl fullWidth margin="dense" size="small">
          <InputLabel>Case Sensitivity</InputLabel>
          <Controller
            name={`descriptionUpdate.descriptions.${index}.caseSignificance`}
            control={control}
            render={({ field: controllerField }) => (
              <Select {...controllerField} disabled={disabled}>
                {Object.values(CaseSignificance).map(value => (
                  <MenuItem key={value} value={value}>
                    {caseSignificanceDisplay[value]}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        </FormControl>
      </Grid>
      {/* Add Delete Button for New Descriptions */}
      {description?.descriptionId === undefined && (
        <Grid item xs={12} md={1}>
          <IconButton
            disabled={disabled}
            onClick={() => handleDeleteDescription(index)}
            color="error"
          >
            <Delete />
          </IconButton>
        </Grid>
      )}
      <Divider sx={{ width: '100%', my: 1 }} />
    </Grid>
  );
};

function processDescriptionsWithSemanticTags(
  updatedDescriptions: Description[] | undefined,
  existingDescriptions: Description[],
): Description[] {
  if (!updatedDescriptions) return [];
  const existingDescriptionsMap = new Map(
    existingDescriptions.map(desc => [desc.descriptionId, desc]),
  );

  const returnVal = updatedDescriptions.map(updatedDesc => {
    const existingDesc = existingDescriptionsMap.get(updatedDesc.descriptionId);
    // No matching existing description, return the updated description as is
    if (!existingDesc) return updatedDesc;

    const updatedTag = extractSemanticTag(updatedDesc.term);
    const existingTag = extractSemanticTag(existingDesc.term);

    let newTerm = updatedDesc.term;

    if (updatedTag === undefined && existingTag !== undefined) {
      // Updated description DOES NOT have a tag, but the old one DOES
      newTerm = `${updatedDesc.term.replace(/\s*\(.*?\)\s*$/, '').trim()} ${existingTag}`;
    } else if (updatedTag !== existingTag) {
      // Updated description HAS a tag, and it DIFFERS from the old one. OR Updated description has a tag and the old one doesn't
      // if the updated description has a tag, keep that one regardless of if the old one has one or not
      newTerm = updatedDesc.term;
    } else {
      // Updated description tag is the same as the existing tag, OR neither has a tag
      // if the updated description has no tag, but the old description has one, we should remove the old one
      if (!updatedTag && existingTag) {
        newTerm = updatedDesc.term.replace(/\s*\(.*?\)\s*$/, '').trim();
      } else {
        newTerm = updatedDesc.term;
      }
    }

    return {
      ...updatedDesc,
      term: newTerm,
    };
  });
  return returnVal;
}

function removeNotAcceptable(desc: Description) {
  // Filter out entries where value is "NOT ACCEPTABLE"
  if (desc.acceptabilityMap) {
    desc.acceptabilityMap = Object.fromEntries(
      Object.entries(desc.acceptabilityMap).filter(
        // eslint-disable-next-line
        ([_, value]) => value !== 'NOT ACCEPTABLE',
      ),
    );
  }

  return desc;
}

function adjustTypeIds(desc: Description): Description {
  return {
    ...desc,
    typeId: typeMap[desc.type],
  };
}
