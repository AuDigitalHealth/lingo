import {
  Button,
  FormControl,
  FormControlLabel,
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
import { Acceptability, Description, Product } from '../../types/concept.ts';
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
  UseFormHandleSubmit,
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
import ConceptService from '../../api/ConceptService.ts';
import { useTheme } from '@mui/material/styles';
import {
  areTwoExternalIdentifierArraysEqual,
  sortExternalIdentifiers,
} from '../../utils/helpers/tickets/additionalFieldsUtils.ts';
import { getSearchConceptsByEclOptions } from '../../hooks/api/useInitializeConcepts.tsx';
import { generateEclFromBinding } from '../../utils/helpers/EclUtils.ts';
import { useFieldBindings } from '../../hooks/api/useInitializeConfig.tsx';
import { productUpdateValidationSchema } from '../../types/productValidations.ts';
import { yupResolver } from '@hookform/resolvers/yup';
import { useQueryClient } from '@tanstack/react-query';
import { extractSemanticTag } from '../../utils/helpers/ProductPreviewUtils.ts';
import { AxiosError } from 'axios';
import { SnowstormError } from '../../types/ErrorHandler.ts';
import { useSearchConceptById } from '../../hooks/api/products/useSearchConcept.tsx';
import { isEqual, cloneDeep } from 'lodash';
import { Add, Delete } from '@mui/icons-material';
import useAvailableProjects, {
  getProjectFromKey,
} from '../../hooks/api/useInitializeProjects.tsx';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore.ts';
import { LanguageRefset, Project } from '../../types/Project.ts';
import ConfirmationModal from '../../themes/overrides/ConfirmationModal.tsx';

const USLangRefset: LanguageRefset = {
  default: 'false',
  en: '900000000000509007',
  dialectName: 'US',
  readOnly: 'false',
};

interface ProductEditModalProps {
  open: boolean;
  handleClose: () => void;
  product: Product;
  keepMounted: boolean;
  branch: string;
  ticket: Ticket;
  handleProductChange: (product: Product) => void;
  isCtpp: boolean;
}

export default function ProductEditModal({
  open,
  handleClose,
  keepMounted,
  product,
  branch,
  ticket,
  handleProductChange,
  isCtpp,
}: ProductEditModalProps) {
  const updateProductDescriptionMutation = useUpdateProductDescription();
  const updateProductExternalIdentifierMutation =
    useUpdateProductExternalIdentifiers();
  const { isPending } = updateProductDescriptionMutation;
  const { isPending: isExternalIdentifiersPending } =
    updateProductExternalIdentifierMutation;
  const isUpdating = isPending || isExternalIdentifiersPending;
  const closeHandle = () => {
    if (!isUpdating) {
      handleClose();
    }
  };

  return (
    <>
      {open && (
        <BaseModal
          open={open}
          handleClose={closeHandle}
          keepMounted={keepMounted}
          sx={{ width: '60%' }}
        >
          <BaseModalHeader title={'Edit Product'} />
          <BaseModalBody sx={{ overflow: 'auto' }}>
            <EditConceptBody
              product={product}
              branch={branch}
              handleClose={handleClose}
              ticket={ticket}
              handleProductChange={handleProductChange}
              isCtpp={isCtpp}
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
  handleProductChange: (product: Product) => void;
  isCtpp: boolean;
}

function EditConceptBody({
  product,
  branch,
  handleClose,
  ticket,
  handleProductChange,
  isCtpp,
}: EditConceptBodyProps) {
  console.log('render edit concept body');
  const { data, isLoading } = useSearchConceptById(product.conceptId, branch);

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
    return (
      data?.descriptions?.filter(des => {
        // show all descriptions
        if (displayRetiredDescriptions) return true;
        // only show active descriptions
        return des.active;
      }) || []
    );
  }, [data?.descriptions, displayRetiredDescriptions]);
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

    const fsn = descriptions.find(d => d.type === 'FSN');
    const preferredSynonym = descriptions.find(isPreferredTerm);
    const otherSynonyms = descriptions.filter(
      d => d.type === 'SYNONYM' && d !== preferredSynonym,
    );

    return [
      ...(fsn ? [fsn] : []),
      ...(preferredSynonym ? [preferredSynonym] : []),
      ...otherSynonyms,
    ];
    // eslint-disable-next-line
  }, [descriptions, defaultLangRefset]);

  const { fieldBindings } = useFieldBindings(branch);

  const ctppSearchEcl = generateEclFromBinding(fieldBindings, 'product.search');

  const semanticTag = extractSemanticTag(product.fullySpecifiedName as string);

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
  } = useForm<ProductUpdateRequest>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    criteriaMode: 'all',
    resolver: yupResolver(productUpdateValidationSchema),
    defaultValues: defaultValues,
  });

  const { fields, append } = useFieldArray({
    control,
    name: 'descriptionUpdate.descriptions',
  });

  useEffect(() => {
    const currentDescriptions = getValues('descriptionUpdate.descriptions');
    if (
      sortedDescriptions.length > 0 &&
      !isEqual(currentDescriptions, sortedDescriptions)
    ) {
      console.log('resetting form in useEffect');
      reset({
        ...defaultValues,
        descriptionUpdate: {
          ...defaultValues.descriptionUpdate,
          descriptions: sortedDescriptions,
        },
      });
    }
    // eslint-disable-next-line
  }, [sortedDescriptions, reset, getValues]);

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
      !(isPending || isExternalIdentifiersPending) &&
      (updateProductDescriptionData || updateExternalIdentifierData)
    ) {
      reset();
      handleClose();
    }
  }, [
    reset,
    handleClose,
    isPending,
    updateProductDescriptionData,
    isExternalIdentifiersPending,
    updateExternalIdentifierData,
  ]);

  const onSubmit = (data: ProductUpdateRequest) => {
    if (!isCtpp) {
      setConfirmationModalOpen(true);
      formSubmissionData.current = cloneDeep(data);
      return;
    } else {
      void updateProduct(cloneDeep(data));
    }
  };
  const formSubmissionData = useRef<ProductUpdateRequest | null>(null);
  const queryClient = useQueryClient();

  const updateDescription = (request: ProductDescriptionUpdateRequest) => {
    const productId = product.conceptId;

    updateProductDescriptionMutation.mutate(
      {
        productDescriptionUpdateRequest: request,
        productId: productId,
        branch: branch,
      },
      {
        onSuccess: concept => {
          const queryKey = getSearchConceptsByEclOptions(
            descriptions.find(d => d.type === 'FSN')?.term as string,
            ctppSearchEcl,
            branch,
            false,
            undefined,
            true,
          ).queryKey;
          void queryClient.invalidateQueries({ queryKey: queryKey });
          formSubmissionData.current = null;
          void ConceptService.searchUnpublishedConceptByIds(
            [concept.conceptId as string],
            branch,
          ).then(c => {
            if (c.items.length > 0) {
              product.concept = c.items[0];
              product.fullySpecifiedName = c.items[0].fsn?.term;
              product.preferredTerm = c.items[0].pt?.term;
              handleProductChange(product);
            }
            // resolve();
          });
          // .catch(reject);
        },
        // onError: reject,
      },
    );
    // });
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

    const newFsn = data.descriptionUpdate?.descriptions?.find(description => {
      return description.type === 'FSN';
    });

    const newFsnIndex = data.descriptionUpdate?.descriptions?.findIndex(
      description => {
        return description.type === 'FSN';
      },
    ) as number;
    const existingFsn = descriptions?.find(description => {
      return description.type === 'FSN';
    });
    const isFsnModified = newFsn?.term !== existingFsn?.term;

    const readOnlyLangRefsetsIds = langRefsets
      .filter(langRefset => {
        return langRefset.readOnly === 'true';
      })
      .map(langRefset => langRefset.en);
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

    const anyDescriptionModified = !isEqual(
      sortedDescriptions,
      data.descriptionUpdate?.descriptions,
    );

    const artgModified = !areTwoExternalIdentifierArraysEqual(
      data.externalRequesterUpdate.externalIdentifiers,
      product.externalIdentifiers ? product.externalIdentifiers : [],
    );

    if (
      newFsn !== undefined &&
      isFsnModified &&
      semanticTag &&
      isCtpp &&
      !newFsn.term.trim().endsWith(semanticTag)
    ) {
      setError(`descriptionUpdate.descriptions.${newFsnIndex}.term`, {
        type: 'manual',
        message: 'The semantic tag does not align.',
      });
      return;
    }
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
      <Box sx={{ width: '100%' }}>
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
                  product={product}
                  descriptions={sortedDescriptions}
                  isCtpp={isCtpp}
                  dialects={langRefsets}
                />

                {/* Right Section */}
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
                      <InnerBoxSmall component="fieldset">
                        <FieldLabelRequired>FSN</FieldLabelRequired>
                        {/* {!isLoading && */}
                        {!isLoading &&
                          fields.map((field, index) => {
                            return (
                              <FieldDescriptions
                                field={field}
                                sortedDescriptions={sortedDescriptions}
                                index={index}
                                handleDeleteDescription={
                                  handleDeleteDescription
                                }
                                isPreferredTerm={isPreferredTerm}
                                langRefsets={langRefsets}
                                control={control}
                                project={project}
                                disabled={isUpdating}
                              />
                            );
                          })}
                      </InnerBoxSmall>
                      <IconButton
                        onClick={handleAddDescription}
                        aria-label="add description"
                      >
                        <Add />
                      </IconButton>
                      {isCtpp && (
                        <Grid>
                          <InnerBoxSmall component="fieldset">
                            <legend>Artg Ids</legend>
                            <Grid paddingTop={1}></Grid>
                            <ArtgAutoComplete
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
                    </form>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* Buttons - Positioned at the Right Bottom */}
          <ActionButton
            control={control}
            resetAndClose={resetAndClose}
            isSubmitting={isUpdating}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            toggleDisplayRetiredDescriptions={toggleDisplayRetiredDescriptions}
            displayRetiredDescriptions={displayRetiredDescriptions}
          />
        </Grid>
      </Box>
    </>
  );
}
interface LeftSectionProps {
  product: Product;
  descriptions: Description[];
  isCtpp: boolean;
  dialects: LanguageRefset[];
}

function LeftSection({
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
          {descriptions.map((description, index) => {
            const isPreferred = isPreferredTerm(description);
            const label =
              description.type === 'FSN'
                ? 'FSN'
                : isPreferred
                  ? 'Preferred Term'
                  : 'Synonym';

            return (
              <Grid
                container
                spacing={2}
                key={description.descriptionId}
                alignItems="center"
              >
                <Grid item xs={12} md={4}>
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
                {dialects.map(dialect => (
                  <Grid item xs={12} md={2.5} key={dialect.en}>
                    <FormControl fullWidth margin="dense">
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
                        {['PREFERRED', 'ACCEPTABLE'].map((value: string) => (
                          <MenuItem key={value} value={value}>
                            {value}
                          </MenuItem>
                        ))}
                        <MenuItem value={'NOT ACCEPTABLE'}>
                          NOT ACCEPTABLE
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                ))}
              </Grid>
            );
          })}
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

interface ActionButtonProps {
  control: Control<ProductUpdateRequest>;
  resetAndClose: () => void;
  handleSubmit: UseFormHandleSubmit<ProductUpdateRequest>;
  onSubmit: (product: ProductUpdateRequest) => void;
  isSubmitting: boolean;
  toggleDisplayRetiredDescriptions: () => void;
  displayRetiredDescriptions: boolean;
}
function ActionButton({
  control,
  resetAndClose,
  handleSubmit,
  onSubmit,
  isSubmitting,
  toggleDisplayRetiredDescriptions,
  displayRetiredDescriptions,
}: ActionButtonProps) {
  const { dirtyFields } = useFormState({ control });
  const isDirty = Object.keys(dirtyFields).length > 0;

  const isButtonDisabled = () => isSubmitting || !isDirty;
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
          onClick={event => void handleSubmit(onSubmit)(event)}
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
    type: 'SYNONYM',
    lang: 'en',
    caseSignificance: 'ENTIRE_TERM_CASE_SENSITIVE',
  };
};

interface FieldDescriptionsProps {
  sortedDescriptions: Description[];
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
  project: Project | undefined;
  disabled: boolean;
}
const FieldDescriptions = ({
  sortedDescriptions,
  index,
  isPreferredTerm,
  handleDeleteDescription,
  langRefsets,
  field,
  control,
  project,
  disabled,
}: FieldDescriptionsProps) => {
  const description = sortedDescriptions[index];

  const containsSemanticTag = extractSemanticTag(description?.term)
    ?.trim()
    .toLocaleLowerCase();

  const escapedSemanticTag = containsSemanticTag
    ? containsSemanticTag.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    : undefined;

  const termWithoutTag =
    description?.term && escapedSemanticTag
      ? description.term
          .replace(new RegExp(`\\s*${escapedSemanticTag}\\s*$`, 'i'), '')
          .trim()
      : description?.term || '';

  const [inputValue, setInputValue] = useState(termWithoutTag || '');

  useEffect(() => {
    setInputValue(termWithoutTag || '');
  }, [termWithoutTag]);

  const descriptionType = sortedDescriptions[index]?.type;
  const isPreferred = isPreferredTerm(sortedDescriptions[index]);
  const label =
    descriptionType === 'FSN'
      ? 'FSN'
      : isPreferred
        ? 'Preferred Term'
        : 'Synonym';

  return (
    <Grid container spacing={2} key={field.id} alignItems="center">
      <Grid item xs={12} md={3.5}>
        <Controller
          name={`descriptionUpdate.descriptions.${index}.active`}
          control={control}
          disabled={disabled}
          render={({ field: controllerField }) => {
            return (
              <Switch
                {...controllerField}
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
          disabled={disabled}
          render={({ field: controllerField, fieldState }) => {
            return (
              <TextField
                {...controllerField}
                // Use the term without the semantic tag for the TextField value
                value={inputValue}
                label={`${label}`}
                fullWidth
                margin="dense"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                multiline
                minRows={1}
                maxRows={4}
                onChange={e => {
                  setInputValue(e.target.value);
                  controllerField.onChange(e.target.value);
                }}
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

      {langRefsets.map(dialect => {
        const thisLangRefset = project?.metadata.requiredLanguageRefsets.find(
          langRefset => {
            return langRefset.en === dialect.en;
          },
        );
        return (
          <Grid item xs={12} md={2} key={dialect.en}>
            <FormControl fullWidth margin="dense">
              <InputLabel>{dialect.dialectName}</InputLabel>
              <Controller
                disabled={disabled || thisLangRefset?.readOnly === 'true'}
                name={`descriptionUpdate.descriptions.${index}.acceptabilityMap.${dialect.en}`}
                control={control}
                defaultValue={
                  sortedDescriptions[index]?.acceptabilityMap?.[dialect.en] ||
                  ('NOT ACCEPTABLE' as Acceptability)
                }
                render={({ field: controllerField }) => (
                  <>
                    <Select {...controllerField}>
                      {['PREFERRED', 'ACCEPTABLE'].map((value: string) => (
                        <MenuItem key={value} value={value}>
                          {value}
                        </MenuItem>
                      ))}
                      <MenuItem value={'NOT ACCEPTABLE'}>
                        NOT ACCEPTABLE
                      </MenuItem>
                    </Select>
                  </>
                )}
              />
            </FormControl>
          </Grid>
        );
      })}
      {/* Add Delete Button for New Descriptions */}
      {description?.descriptionId === undefined && (
        <Grid item xs={12} md={0.5}>
          <IconButton
            disabled={disabled}
            onClick={() => handleDeleteDescription(index)}
            color="error"
          >
            <Delete />
          </IconButton>
        </Grid>
      )}
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
