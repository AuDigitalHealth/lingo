import React, { useState, useEffect } from 'react';

import { Button, TextField, CircularProgress, Box } from '@mui/material';
import { Concept } from '../../../../types/concept.ts';
import { BrandCreationDetails } from '../../../../types/product.ts';
import { Ticket } from '../../../../types/tickets/ticket.ts';
import useDebounce from '../../../../hooks/useDebounce.tsx';
import { useSearchConceptsByEcl } from '../../../../hooks/api/useInitializeConcepts.tsx';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateBrand } from '../../../../hooks/api/products/useCreateBrand.tsx';
import ConceptService from '../../../../api/ConceptService.ts';
import { getSearchConceptsByEclOptions } from '../../../../hooks/api/useInitializeConcepts.tsx';
import BaseModal from '../../../../components/modal/BaseModal.tsx';
import BaseModalBody from '../../../../components/modal/BaseModalBody.tsx';
import BaseModalFooter from '../../../../components/modal/BaseModalFooter.tsx';
import BaseModalHeader from '../../../../components/modal/BaseModalHeader.tsx';

interface CreateBrandProps {
  open: boolean;
  onClose: () => void;
  onAddBrand: (brand: Concept) => void;
  uiSchema: any;
  branch: string;
  ticket?: Ticket;
}

const CreateBrand: React.FC<CreateBrandProps> = ({
  open,
  onClose,
  onAddBrand,
  uiSchema,
  branch,
  ticket,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [nameExists, setNameExists] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(inputValue, 700);

  const createBrandOptions = uiSchema?.['ui:options']?.createBrand || {};
  const ecl = createBrandOptions.ecl;
  const semanticTag = createBrandOptions.semanticTags || '';

  const { allData, isLoading } = useSearchConceptsByEcl(
    debouncedSearch,
    ecl,
    branch,
    false,
  );

  const createBrandMutation = useCreateBrand();

  const handleCreateBrand = () => {
    if (!nameExists && ticket && inputValue) {
      setError('');
      const brandCreationDetails: BrandCreationDetails = {
        brandName: inputValue,
        ticketId: ticket.id,
      };
      createBrandMutation.mutate(
        { brandCreationDetails, branch },
        {
          onSuccess: concept => {
            const queryKey = getSearchConceptsByEclOptions(
              debouncedSearch,
              ecl,
              branch,
              false,
            ).queryKey;
            if (
              semanticTag &&
              queryKey.length > 0 &&
              queryKey[0].includes(semanticTag)
            ) {
              const newQueryKey = [removeSemanticTag(queryKey[0], semanticTag)];
              void queryClient.invalidateQueries({ queryKey: newQueryKey });
            }
            void queryClient.invalidateQueries({ queryKey });
            void ConceptService.searchUnpublishedConceptByIds(
              [concept?.conceptId as string],
              branch,
            ).then(c => {
              if (c.items.length > 0) {
                onAddBrand(c.items[0]);
              }
            });
            handleCloseModal();
          },
          onError: () => {
            setError('Failed to create brand');
          },
        },
      );
    } else if (!inputValue) {
      setError('Brand name is required');
    } else if (!ticket) {
      setError('Ticket information is missing');
    } else if (nameExists) {
      setError('This brand name already exists!');
    }
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
      setError('This brand name already exists!');
    } else {
      setNameExists(false);
      if (inputValue) setError('');
    }
  }, [allData, inputValue]);

  const handleCloseModal = () => {
    if (!createBrandMutation.isPending) {
      setInputValue('');
      setNameExists(false);
      setError('');
      onClose();
    }
  };

  const isButtonDisabled = () =>
    createBrandMutation.isPending ||
    nameExists ||
    !inputValue ||
    inputValue.length < 3 ||
    isLoading;

  return (
    <BaseModal open={open} handleClose={handleCloseModal}>
      <BaseModalHeader title="Create Brand Name" />
      <BaseModalBody>
        <TextField
          label="Enter Brand Name"
          fullWidth
          margin="normal"
          value={inputValue}
          onChange={e => setInputValue(e.target.value.trim())}
          error={!!error}
          helperText={error}
          sx={{ minWidth: '300px' }}
          autoFocus
          disabled={createBrandMutation.isPending}
          data-testid="create-brand-input"
        />
        {isLoading && <CircularProgress size={24} sx={{ mt: 2 }} />}
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              data-testid="create-brand-btn"
              color="primary"
              size="small"
              variant="contained"
              onClick={handleCreateBrand}
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
            <Button
              variant="contained"
              color="error"
              onClick={handleCloseModal}
              disabled={createBrandMutation.isPending}
            >
              Cancel
            </Button>
          </Box>
        }
      />
    </BaseModal>
  );
};

function removeSemanticTag(originalString: string, semanticTag: string) {
  if (originalString.endsWith(semanticTag)) {
    const lastIndex = originalString.lastIndexOf(semanticTag);
    return (
      originalString.substring(0, lastIndex) +
      originalString.substring(lastIndex + semanticTag.length)
    ).trim();
  }
  return originalString.trim();
}

export default CreateBrand;
