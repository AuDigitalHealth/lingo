import { Button, Grid, TextField, Typography } from '@mui/material';
import BaseModal from '../modal/BaseModal';
import BaseModalBody from '../modal/BaseModalBody';

import BaseModalHeader from '../modal/BaseModalHeader';
import { Product } from '../../types/concept.ts';
import { Box, Stack } from '@mui/system';
import {
  FieldLabelRequired,
  InnerBoxSmall,
} from '../../pages/products/components/style/ProductBoxes.tsx';
import { filterKeypress } from '../../utils/helpers/conceptUtils.ts';
import React, { useState } from 'react';

import {
  Control,
  Controller,
  FieldError,
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

interface ProductEditModalProps {
  open: boolean;
  handleClose: () => void;
  product: Product;
  keepMounted: boolean;
  branch: string;
  ticket: Ticket;
  handleProductChange: (product: Product) => void;
}

export default function ProductEditModal({
  open,
  handleClose,
  keepMounted,
  product,
  branch,
  ticket,
  handleProductChange,
}: ProductEditModalProps) {
  const [isUpdating, setUpdating] = useState(false);
  const closeHandle = () => {
    if (!isUpdating) {
      handleClose();
    }
  };
  return (
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
          setUpdating={setUpdating}
          isUpdating={isUpdating}
        />
      </BaseModalBody>
    </BaseModal>
  );
}
interface EditConceptBodyProps {
  product: Product;
  branch: string;
  handleClose: () => void;
  ticket: Ticket;
  handleProductChange: (product: Product) => void;
  setUpdating: (updating: boolean) => void;
  isUpdating: boolean;
}

function EditConceptBody({
  product,
  branch,
  handleClose,
  ticket,
  handleProductChange,
  setUpdating,
  isUpdating,
}: EditConceptBodyProps) {
  const [artgOptVals, setArtgOptVals] = useState<ExternalIdentifier[]>(
    product.externalIdentifiers ? product.externalIdentifiers : [],
  );
  const { fieldBindings } = useFieldBindings(branch);

  const ctppSearchEcl = generateEclFromBinding(fieldBindings, 'product.search');

  const semanticTag = extractSemanticTag(product.fullySpecifiedName as string);

  const defaultValues: ProductUpdateRequest = {
    externalRequesterUpdate: {
      externalIdentifiers: product.externalIdentifiers
        ? sortExternalIdentifiers(product.externalIdentifiers)
        : [],
      ticketId: ticket.id,
    },
    descriptionUpdate: {
      preferredTerm: product.preferredTerm,
      fullySpecifiedName: product.fullySpecifiedName,
      ticketId: ticket.id,
    },
  };
  const {
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors },
  } = useForm<ProductUpdateRequest>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    criteriaMode: 'all',
    resolver: yupResolver(productUpdateValidationSchema),
    defaultValues: defaultValues,
  });

  const theme = useTheme();
  const updateProductDescriptionMutation = useUpdateProductDescription();
  const updateProductExternalIdentifierMutation =
    useUpdateProductExternalIdentifiers();

  const onSubmit = (data: ProductUpdateRequest) => {
    void updateProduct(data);
  };
  const queryClient = useQueryClient();

  const updateDescription = (
    productDescriptionUpdateRequest: ProductDescriptionUpdateRequest,
  ) => {
    setUpdating(true);
    const productId = product.conceptId;
    productDescriptionUpdateRequest.ticketId = ticket.id;

    return new Promise<void>((resolve, reject) => {
      updateProductDescriptionMutation.mutate(
        { productDescriptionUpdateRequest, productId, branch },
        {
          onSuccess: concept => {
            const queryKey = getSearchConceptsByEclOptions(
              productDescriptionUpdateRequest.fullySpecifiedName as string,
              ctppSearchEcl,
              branch,
              false,
              undefined,
              true,
            ).queryKey;
            void queryClient.invalidateQueries({ queryKey: queryKey });
            void ConceptService.searchUnpublishedConceptByIds(
              [concept.conceptId as string],
              branch,
            )
              .then(c => {
                if (c.items.length > 0) {
                  product.concept = c.items[0];
                  product.fullySpecifiedName = c.items[0].fsn?.term;
                  product.preferredTerm = c.items[0].pt?.term;
                  handleProductChange(product);
                }
                resolve();
              })
              .catch(reject);
          },
          onError: reject,
        },
      );
    });
  };

  const updateArtgIds = (
    externalRequesterUpdate: ProductExternalRequesterUpdateRequest,
    productId: string,
    ticketId: number,
  ) => {
    setUpdating(true);
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
    const isFsnModified =
      product.fullySpecifiedName !== data.descriptionUpdate?.fullySpecifiedName;
    const isPtModified =
      product.preferredTerm !== data.descriptionUpdate?.preferredTerm;
    const artgModified = !areTwoExternalIdentifierArraysEqual(
      data.externalRequesterUpdate.externalIdentifiers,
      product.externalIdentifiers ? product.externalIdentifiers : [],
    );

    if (
      isFsnModified &&
      semanticTag &&
      !data.descriptionUpdate?.fullySpecifiedName?.trim().endsWith(semanticTag)
    ) {
      setError('descriptionUpdate.fullySpecifiedName', {
        type: 'manual',
        message: 'The semantic tag does not align.',
      });
      return;
    }
    try {
      if (artgModified && (isFsnModified || isPtModified)) {
        void (await updateArtgIds(
          data.externalRequesterUpdate,
          productId,
          ticket.id,
        ));
        void (await updateDescription(data.descriptionUpdate));
        reset(data);
        setUpdating(false);
        handleClose();
      } else if (artgModified) {
        void (await updateArtgIds(
          data.externalRequesterUpdate,
          productId,
          ticket.id,
        ));
        reset(data);
        setUpdating(false);
        handleClose();
      } else if (isFsnModified || isPtModified) {
        void (await updateDescription(data.descriptionUpdate));
        reset(data);
        setUpdating(false);
        handleClose();
      }
    } catch (error) {
      const err = error as AxiosError<SnowstormError>;
      if (
        err.response?.data.detail.includes(
          'already exists. Cannot create a new concept with the same name.',
        )
      ) {
        setError('descriptionUpdate.fullySpecifiedName', {
          type: 'manual',
          message: 'This name already exists!',
        });
      }
    } finally {
      setUpdating(false);
    }
  };
  const resetAndClose = () => {
    setArtgOptVals(
      product.externalIdentifiers ? product.externalIdentifiers : [],
    );
    reset(defaultValues);

    handleClose();
  };

  return (
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
              <LeftSection product={product} />

              {/* Right Section */}
              <Grid
                item
                xs={6}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  paddingLeft: 1, // Add padding to separate from left section
                  position: 'relative', // To allow absolute positioning of buttons at bottom
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
                  <form onSubmit={event => void handleSubmit(onSubmit)(event)}>
                    <InnerBoxSmall component="fieldset">
                      <FieldLabelRequired>FSN</FieldLabelRequired>
                      <Controller
                        name="descriptionUpdate.fullySpecifiedName"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Enter new FSN value"
                            fullWidth
                            margin="dense"
                            error={
                              !!errors.descriptionUpdate?.fullySpecifiedName
                            }
                            helperText={
                              errors.descriptionUpdate?.fullySpecifiedName
                                ?.message
                            }
                            multiline
                            minRows={1}
                            maxRows={4}
                            onChange={e => {
                              field.onChange(e); // Update the form value
                            }}
                          />
                        )}
                      />
                    </InnerBoxSmall>
                    <InnerBoxSmall component="fieldset">
                      <FieldLabelRequired>Preferred Term</FieldLabelRequired>
                      <Controller
                        name="descriptionUpdate.preferredTerm"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Enter new Preferred Term"
                            fullWidth
                            multiline
                            minRows={1}
                            maxRows={4}
                            margin="dense"
                            error={!!errors.descriptionUpdate?.preferredTerm}
                            helperText={
                              errors.descriptionUpdate?.preferredTerm?.message
                            }
                            onChange={e => {
                              field.onChange(e);
                            }}
                          />
                        )}
                      />
                    </InnerBoxSmall>
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
        />
      </Grid>
    </Box>
  );
}
interface LeftSectionProps {
  product: Product;
}

function LeftSection({ product }: LeftSectionProps) {
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
        {/* FSN Section */}
        <InnerBoxSmall component="fieldset">
          <legend>FSN</legend>
          <TextField
            fullWidth
            variant="outlined"
            margin="dense"
            multiline
            minRows={1}
            maxRows={4}
            InputLabelProps={{ shrink: true }}
            onKeyDown={filterKeypress}
            value={product.fullySpecifiedName || ''}
            aria-readonly={true}
          />
        </InnerBoxSmall>

        {/* Preferred Term Section */}
        <InnerBoxSmall component="fieldset">
          <legend>Preferred Term</legend>
          <TextField
            fullWidth
            variant="outlined"
            margin="dense"
            multiline
            minRows={1}
            maxRows={4}
            InputLabelProps={{ shrink: true }}
            onKeyDown={filterKeypress}
            value={product.preferredTerm || ''}
            aria-readonly={true}
          />
        </InnerBoxSmall>

        {/* Artg Ids Section */}
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
              aria-readonly={true}
            />
          </InnerBoxSmall>
        </Grid>
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
}
function ActionButton({
  control,
  resetAndClose,
  handleSubmit,
  onSubmit,
  isSubmitting,
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
