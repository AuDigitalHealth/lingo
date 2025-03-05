import React, { useState } from 'react';
import { FieldProps } from '@rjsf/core';
import {
  Box,
  FormHelperText,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Concept, ConceptMini } from '../../../../types/concept.ts';
import { SetExtendedEclButton } from '../../components/SetExtendedEclButton.tsx';
import EclAutocomplete from '../components/EclAutocomplete.tsx';
import CreateBrand from '../components/CreateBrand.tsx';
import useTaskById from '../../../../hooks/useTaskById.tsx';
import { useTicketByTicketNumber } from '../../../../hooks/api/tickets/useTicketById.tsx';
import { useParams } from 'react-router-dom';
import { Ticket } from '../../../../types/tickets/ticket.ts';

const AutoCompleteField = ({
  schema,
  uiSchema,
  formData,
  onChange,
  rawErrors,
}: FieldProps) => {
  const { branch, ecl, showDefaultOptions, extendedEcl } =
    uiSchema['ui:options'] || {};
  const [localExtendedEcl, setLocalExtendedEcl] = useState<boolean>(false);
  const [openCreateBrandModal, setOpenCreateBrandModal] = useState(false);
  const currentEcl = localExtendedEcl ? extendedEcl : ecl;
  const task = useTaskById();
  const { ticketNumber } = useParams();
  const useTicketQuery = useTicketByTicketNumber(ticketNumber, false);

  const title = schema.title || uiSchema['ui:title'];
  const isDisabled = uiSchema['ui:options']?.disabled || false;
  const errorMessage =
    rawErrors && rawErrors[0] ? rawErrors[0].message || '' : '';

  const handleChange = (conceptMini: ConceptMini | null) => {
    onChange(conceptMini);
  };

  const handleAddBrand = (brand: Concept) => {
    onChange({
      conceptId: brand.conceptId,
      pt: brand.pt || { term: brand.fsn?.term || 'Unnamed Brand' },
    });
    setOpenCreateBrandModal(false);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1}>
        <Box flex={50} sx={{ position: 'relative' }}>
          <EclAutocomplete
            value={formData}
            onChange={handleChange}
            ecl={currentEcl}
            branch={branch}
            showDefaultOptions={showDefaultOptions}
            isDisabled={isDisabled}
            title={title}
            errorMessage={errorMessage}
          />
          {uiSchema?.['ui:options']?.createBrand && (
            <Tooltip title="Create Brand">
              <IconButton
                onClick={() => setOpenCreateBrandModal(true)}
                sx={{
                  position: 'absolute',
                  right: '-40px', // Adjust to move right of EclAutocomplete
                  top: '0', // Adjust to position just above
                }}
                disabled={isDisabled}
              >
                <AddCircleOutlineIcon color="primary" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {extendedEcl && (
          <Box flex={1}>
            <SetExtendedEclButton
              setExtendedEcl={setLocalExtendedEcl}
              extendedEcl={localExtendedEcl}
              disabled={isDisabled}
            />
          </Box>
        )}
      </Box>
      {uiSchema?.['ui:options']?.createBrand && (
        <CreateBrand
          open={openCreateBrandModal}
          onClose={() => setOpenCreateBrandModal(false)}
          onAddBrand={handleAddBrand}
          uiSchema={uiSchema}
          branch={task?.branchPath as string}
          ticket={useTicketQuery.data as Ticket}
        />
      )}
      {errorMessage && <FormHelperText error>{errorMessage}</FormHelperText>}
    </Box>
  );
};

export default AutoCompleteField;
