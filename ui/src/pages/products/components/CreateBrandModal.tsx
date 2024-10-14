import React, { useEffect, useState } from 'react';
import BaseModal from '../../../components/modal/BaseModal';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';
import BaseModalFooter from '../../../components/modal/BaseModalFooter';
import { Button, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { Box } from '@mui/system';

import useDebounce from '../../../hooks/useDebounce.tsx';
import {
  getSearchConceptsByEclOptions,
  useSearchConceptsByEcl,
} from '../../../hooks/api/useInitializeConcepts.tsx';
import { generateEclFromBinding } from '../../../utils/helpers/EclUtils.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';
import { BrandCreationDetails } from '../../../types/product.ts';
import { Ticket } from '../../../types/tickets/ticket.ts';

import { useQueryClient } from '@tanstack/react-query';
import { useCreateBrand } from '../../../hooks/api/products/useCreateBrand.tsx';
import { Concept } from '../../../types/concept.ts';

interface CreateBrandModalProps {
  open: boolean;
  handleClose: () => void;
  branch: string;
  ticket: Ticket;
  fieldBindings: FieldBindings;
  handleSetNewBrand: (newBrand: Concept) => void;
}

export default function CreateBrandModal({
  open,
  handleClose,
  branch,
  fieldBindings,
  ticket,
  handleSetNewBrand,
}: CreateBrandModalProps) {
  const {
    handleSubmit,
    control,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<BrandCreationDetails>();

  const [inputValue, setInputValue] = useState('');
  const [nameExists, setNameExists] = useState(false);
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(inputValue, 700);
  const brandNameSearchEcl = generateEclFromBinding(
    fieldBindings,
    'package.productName',
  );
  const semanticTag = generateEclFromBinding(
    fieldBindings,
    'product.productName.semanticTag',
  );

  const { allData, isLoading } = useSearchConceptsByEcl(
    debouncedSearch,
    brandNameSearchEcl,
    branch,
    false,
  );

  const createBrandMutation = useCreateBrand();

  const createBrand = (brandCreationDetails: BrandCreationDetails) => {
    createBrandMutation.mutate(
      { brandCreationDetails, branch },
      {
        onSuccess: concept => {
          const queryKey = getSearchConceptsByEclOptions(
            debouncedSearch,
            brandNameSearchEcl,
            branch,
            false,
          ).queryKey;
          if (queryKey.length > 0 && queryKey[0].includes(semanticTag)) {
            const newQueryKey = [removeSemanticTag(queryKey[0], semanticTag)];
            void queryClient.invalidateQueries({ queryKey: newQueryKey });
          }

          void queryClient.invalidateQueries({ queryKey });
          handleSetNewBrand(concept);
          handleClose();
        },
      },
    );
  };

  useEffect(() => {
    if (
      allData?.some(
        c =>
          c.pt?.term.toLowerCase() === inputValue.toLowerCase() ||
          c.fsn?.term.toLowerCase() === inputValue.toLowerCase(),
      )
    ) {
      setNameExists(true);
      setError('brandName', {
        type: 'manual',
        message: 'This name already exists!',
      });
    } else {
      setNameExists(false);
      clearErrors('brandName');
    }

    if (!inputValue) {
      clearErrors('brandName');
    }
  }, [allData, inputValue]);

  const onSubmit = (data: BrandCreationDetails) => {
    if (!nameExists) {
      data.ticketId = ticket.id;
      createBrand(data);
    }
  };

  const isButtonDisabled = () =>
    createBrandMutation.isPending ||
    nameExists ||
    !inputValue ||
    inputValue.length < 3 ||
    isLoading;

  return (
    <BaseModal open={open} handleClose={handleClose}>
      <BaseModalHeader title="Create Brand Name" />
      <BaseModalBody>
        <form onSubmit={event => void handleSubmit(onSubmit)(event)}>
          <Controller
            name="brandName"
            control={control}
            defaultValue=""
            rules={{ required: 'Name is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Enter Brand Name"
                fullWidth
                margin="normal"
                error={!!errors.brandName}
                helperText={errors.brandName?.message}
                onChange={e => {
                  field.onChange(e);
                  setInputValue(e.target.value.trim());
                }}
                sx={{ minWidth: '300px' }}
                autoFocus
              />
            )}
          />
        </form>
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="primary"
              size="small"
              variant="contained"
              onClick={event => void handleSubmit(onSubmit)(event)}
              disabled={isButtonDisabled()}
              sx={{
                '&.Mui-disabled': {
                  color: '#696969',
                },
              }}
            >
              {isLoading
                ? 'Checking...'
                : createBrandMutation.isPending
                  ? 'Creating...'
                  : 'Create Brand'}
            </Button>
            <Button variant="contained" color="error" onClick={handleClose}>
              Cancel
            </Button>
          </Box>
        }
      />
    </BaseModal>
  );
}
function removeSemanticTag(originalString: string, semanticTag: string) {
  if (originalString.endsWith(semanticTag)) {
    // Remove the last occurrence of the substring
    const lastIndex = originalString.lastIndexOf(semanticTag);
    const updatedString =
      originalString.substring(0, lastIndex) +
      originalString.substring(lastIndex + semanticTag.length);

    return updatedString.trim();
  } else {
    return originalString.trim();
  }
}
