import React, {useState} from 'react';
import {FieldProps} from '@rjsf/utils';
import {Box, IconButton, Tooltip} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import {Concept, ConceptMini} from '../../../../types/concept.ts';
import {SetExtendedEclButton} from '../../components/SetExtendedEclButton.tsx';
import EclAutocomplete from '../components/EclAutocomplete.tsx';
import CreateBrand from '../components/CreateBrand.tsx';
import useTaskById from '../../../../hooks/useTaskById.tsx';
import {useTicketByTicketNumber} from '../../../../hooks/api/tickets/useTicketById.tsx';
import {useParams} from 'react-router-dom';
import {Ticket} from '../../../../types/tickets/ticket.ts';
import {updateDependants, updateExclusions} from './behaviour/dependants.ts';

const AutoCompleteField: React.FC<FieldProps<any, any>> = (props) => {
  const { onChange, idSchema } = props;

  const [formContext, setFormContext] = useState(props.formContext || {});
  const [formData, setFormData] = useState(props.formData || {});
  const [uiSchema, setUiSchema] = useState(props.uiSchema || {});
  const [rootFormData, setRootFormData] = useState(formContext?.formData || {});
  const [rootUiSchema, setRootUiSchema] = useState(formContext?.uiSchema || {});

  const { ecl, extendedEcl, createBrand, disabled } =
  uiSchema && uiSchema['ui:options'] || {};
  const [openCreateBrandModal, setOpenCreateBrandModal] = useState(false);
  const [localExtendedEcl, setLocalExtendedEcl] = useState<boolean>(false);
  const currentEcl = localExtendedEcl ? extendedEcl : ecl;

  const task = useTaskById();
  const { ticketNumber } = useParams();
  const useTicketQuery = useTicketByTicketNumber(ticketNumber, false);

  updateDependants(uiSchema, idSchema, formContext, rootFormData, rootUiSchema, formData);
  updateExclusions(uiSchema, idSchema, formContext, rootFormData, rootUiSchema, formData);

  const handleSelect = (conceptMini: ConceptMini | null) => {
    setFormData(conceptMini);
    if (conceptMini) {
      onChange(conceptMini);
    } else {
      onChange(null);
    }
  };

  const handleAddBrand = (brand: Concept) => {
    onChange({
      conceptId: brand.conceptId,
      pt: brand.pt || { term: brand.fsn?.term || 'Unnamed Brand' },
    });
    setOpenCreateBrandModal(false);
  };

  return (
      <span data-component-name="AutoCompleteField">
      <Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box flex={50} sx={{ position: 'relative' }}>
            {task?.branchPath && (
                <EclAutocomplete
                    {...props}
                    ecl={currentEcl}
                    value={formData}
                    disabled={disabled || false}
                    branch={task?.branchPath as string}
                    onChange={handleSelect}
                    errorMessage=""
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
                      disabled={disabled || false}
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
                    disabled={disabled || false}
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
      </Box>
      </span>
  );
};


export default AutoCompleteField;
