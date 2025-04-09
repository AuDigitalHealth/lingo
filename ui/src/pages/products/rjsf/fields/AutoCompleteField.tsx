import React, { useState } from 'react';
import { FieldProps } from '@rjsf/utils';
import { Box, IconButton, Tooltip } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Concept, ConceptMini } from '../../../../types/concept.ts';
import { SetExtendedEclButton } from '../../components/SetExtendedEclButton.tsx';
import EclAutocomplete from '../components/EclAutocomplete.tsx';
import CreateBrand from '../components/CreateBrand.tsx';
import useTaskById from '../../../../hooks/useTaskById.tsx';
import { useTicketByTicketNumber } from '../../../../hooks/api/tickets/useTicketById.tsx';
import { useParams } from 'react-router-dom';
import { Ticket } from '../../../../types/tickets/ticket.ts';

import { ErrorDisplay } from '../components/ErrorDisplay.tsx';
import { getUniqueErrors } from '../helpers/errorUtils.ts';

const AutoCompleteField = ({
  idSchema,
  name,
  schema,
  uiSchema,
  formData,
  onChange,
  rawErrors = [],
  errorSchema = {},
}: FieldProps) => {
  const { ecl, showDefaultOptions, extendedEcl, createBrand, disabled } =
    uiSchema['ui:options'] || {};
  const [localExtendedEcl, setLocalExtendedEcl] = useState<boolean>(false);
  const [openCreateBrandModal, setOpenCreateBrandModal] = useState(false);
  const currentEcl = localExtendedEcl ? extendedEcl : ecl;
  const task = useTaskById();
  const { ticketNumber } = useParams();
  const useTicketQuery = useTicketByTicketNumber(ticketNumber, false);

  const title = schema.title || uiSchema['ui:title'];
  const isDisabled = disabled || false;

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

  // Get unique errors using the common utility
  const allErrors = getUniqueErrors(rawErrors, errorSchema);

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1}>
        <Box flex={50} sx={{ position: 'relative' }}>
          {task?.branchPath && (
            <EclAutocomplete
              idSchema={idSchema}
              name={name}
              value={formData}
              onChange={handleChange}
              ecl={currentEcl}
              branch={task?.branchPath}
              showDefaultOptions={showDefaultOptions}
              isDisabled={isDisabled}
              title={title}
              errorMessage="" // Removed, as errors are handled by ErrorDisplay
            />
          )}
          {createBrand && (
            <Tooltip title="Create Brand">
              <IconButton
                data-testid="create-brand-btn"
                onClick={() => setOpenCreateBrandModal(true)}
                sx={{
                  position: 'absolute',
                  right: '-40px',
                  top: '0',
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
      {createBrand && (
        <CreateBrand
          open={openCreateBrandModal}
          onClose={() => setOpenCreateBrandModal(false)}
          onAddBrand={handleAddBrand}
          uiSchema={uiSchema}
          branch={task?.branchPath as string}
          ticket={useTicketQuery.data as Ticket}
        />
      )}
      <ErrorDisplay errors={allErrors} />
    </Box>
  );
};

export default AutoCompleteField;
