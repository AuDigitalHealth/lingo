import React, { useEffect, useState } from 'react';

import { Box, Button, CircularProgress, TextField } from '@mui/material';
import { Concept } from '../../../../types/concept.ts';
import { PrimitiveConceptCreationDetails } from '../../../../types/product.ts';
import { Ticket } from '../../../../types/tickets/ticket.ts';
import useDebounce from '../../../../hooks/useDebounce.tsx';
import {
  getSearchConceptsByEclOptions,
  useSearchConceptsByEcl,
} from '../../../../hooks/api/useInitializeConcepts.tsx';
import { useQueryClient } from '@tanstack/react-query';
import { useCreatePrimitiveConcept } from '../../../../hooks/api/products/useCreatePrimitiveConcept.tsx';
import ConceptService from '../../../../api/ConceptService.ts';
import BaseModal from '../../../../components/modal/BaseModal.tsx';
import BaseModalBody from '../../../../components/modal/BaseModalBody.tsx';
import BaseModalFooter from '../../../../components/modal/BaseModalFooter.tsx';
import BaseModalHeader from '../../../../components/modal/BaseModalHeader.tsx';
import { FieldProps } from '@rjsf/utils';

interface CreatePrimitiveProps extends FieldProps {
  open: boolean;
  onClose: () => void;
  onAddPrimitive: (primitive: Concept) => void;
  branch: string;
  ticket?: Ticket;
  title?: string;
  ecl: string;
  semanticTag: string;
  parentConceptId: string;
  parentConceptName: string;
}

const CreatePrimitiveConcept: React.FC<CreatePrimitiveProps> = ({
  open,
  onClose,
  onAddPrimitive,
  branch,
  ticket,
  title,
  ecl,
  semanticTag,
  parentConceptId,
  parentConceptName,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [nameExists, setNameExists] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(inputValue, 700);

  const { allData, isLoading } = useSearchConceptsByEcl(
    debouncedSearch,
    ecl,
    branch,
    false,
  );

  const createPrimitiveMutation = useCreatePrimitiveConcept();

  const handleCreatePrimitive = () => {
    if (!nameExists && ticket && inputValue) {
      setError('');
      const primitiveCreationDetails: PrimitiveConceptCreationDetails = {
        conceptName: inputValue.trim(),
        semanticTag: semanticTag,
        parentConceptId: parentConceptId,
        parentConceptName: parentConceptName,
        ticketId: ticket.id,
      };
      createPrimitiveMutation.mutate(
        { primitiveCreationDetails: primitiveCreationDetails, branch },
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
            void ConceptService.searchConceptByIds(
              [concept?.conceptId as string],
              branch,
            ).then(c => {
              if (c.items.length > 0) {
                onAddPrimitive(c.items[0]);
              }
            });
            handleCloseModal();
          },
          onError: () => {
            setError('Failed to create primitive');
          },
        },
      );
    } else if (!inputValue) {
      setError(`${localTitle} is required`);
    } else if (!ticket) {
      setError('Ticket information is missing');
    } else if (nameExists) {
      setError(`This ${localTitle} already exists!`);
    }
  };

  useEffect(() => {
    if (
      allData?.some(
        c =>
          c.pt?.term.toLowerCase() === inputValue.toLowerCase().trim() ||
          c.fsn?.term.toLowerCase() === inputValue.toLowerCase().trim(),
      )
    ) {
      setNameExists(true);
      setError(`This ${localTitle} name already exists!`);
    } else {
      setNameExists(false);
      if (inputValue) setError('');
    }
  }, [allData, inputValue]);

  const handleCloseModal = () => {
    if (!createPrimitiveMutation.isPending) {
      setInputValue('');
      setNameExists(false);
      setError('');
      onClose();
    }
  };

  const isButtonDisabled = () =>
    createPrimitiveMutation.isPending ||
    nameExists ||
    !inputValue ||
    inputValue.length < 3 ||
    isLoading;

  const localTitle =
    title || parentConceptName.replace(/ \(.*\)$/, '').trim() || 'Primitive';
  return (
    <BaseModal open={open} handleClose={handleCloseModal}>
      <BaseModalHeader title={`Create ${localTitle}`} />
      <BaseModalBody>
        <Box sx={{ mb: 2 }}>
          <p>
            This will create a new primitive subtype of the{' '}
            <strong>
              {parentConceptId} | {parentConceptName} |
            </strong>{' '}
            concept. The name you enter below will be used as the preferred term
            and will also become the fully specified name with the semantic tag{' '}
            <strong>{semanticTag}</strong> appended.
          </p>
        </Box>
        <TextField
          label={`Enter ${localTitle}`}
          fullWidth
          margin="normal"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          error={!!error}
          helperText={error}
          sx={{ minWidth: '300px' }}
          autoFocus
          disabled={createPrimitiveMutation.isPending}
          data-testid="create-primitive-input"
        />
        {isLoading && <CircularProgress size={24} sx={{ mt: 2 }} />}
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              data-testid="create-primitive-btn"
              color="primary"
              size="small"
              variant="contained"
              onClick={handleCreatePrimitive}
              disabled={isButtonDisabled()}
              sx={{
                '&.Mui-disabled': {
                  color: '#696969',
                },
              }}
            >
              {isLoading
                ? 'Checking...'
                : createPrimitiveMutation.isPending
                  ? 'Creating...'
                  : `Create`}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleCloseModal}
              disabled={createPrimitiveMutation.isPending}
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

export default CreatePrimitiveConcept;
