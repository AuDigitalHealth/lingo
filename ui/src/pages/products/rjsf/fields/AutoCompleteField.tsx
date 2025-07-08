import React, { useEffect, useState } from 'react';
import { FieldProps } from '@rjsf/utils';
import { Box, IconButton, Tooltip } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Concept, ConceptMini } from '../../../../types/concept.ts';
import { SetExtendedEclButton } from '../../components/SetExtendedEclButton.tsx';
import EclAutocomplete from '../components/EclAutocomplete.tsx';
import MultiValueEclAutocomplete from '../components/MultiValueEclAutocomplete.tsx';
import CreateBrand from '../components/CreateBrand.tsx';
import useTaskById from '../../../../hooks/useTaskById.tsx';
import { useTicketByTicketNumber } from '../../../../hooks/api/tickets/useTicketById.tsx';
import { useParams } from 'react-router-dom';
import { Ticket } from '../../../../types/tickets/ticket.ts';
import { useDependantUpdates } from './../hooks/useDependantUpdates.ts';
import { useExclusionUpdates } from './../hooks/useExclusionUpdates.ts';

const AutoCompleteField: React.FC<FieldProps<any, any>> = props => {
  const { onChange, idSchema, rawErrors,errorSchema } = props;
  const uiSchema = props.uiSchema;
  const isMultivalued = uiSchema?.['ui:options']?.multiValued === true;
  const isShowDefaultOptions =
    uiSchema?.['ui:options']?.showDefaultOptions === true;
  const errorSche = props.formContext.errorSchema;

  const [formContext, setFormContext] = useState(props.formContext || {});
  const [formData, setFormData] = useState(
    props.formData ?? (isMultivalued ? [] : null),
  );
  const [rootFormData, setRootFormData] = useState(
    props.formData ?? (isMultivalued ? [] : null),
  );
  const [rootUiSchema, setRootUiSchema] = useState(
    props?.formContext?.uiSchema || {},
  );

  // Sync local state with props changes (important for Safari)
  useEffect(() => {
    const data = props.formData ?? (isMultivalued ? [] : null);
    setFormData(data);
    setRootFormData(data);
  }, [props.formData, isMultivalued]);

  useEffect(() => {
    setFormContext(props.formContext || {});
    setRootUiSchema(props?.formContext?.uiSchema || {});
  }, [props.formContext]);

  const { ecl, extendedEcl, createBrand, disabled } =
    (uiSchema && uiSchema['ui:options']) || {};
  const [openCreateBrandModal, setOpenCreateBrandModal] = useState(false);
  const [localExtendedEcl, setLocalExtendedEcl] = useState<boolean>(false);
  const currentEcl = localExtendedEcl ? extendedEcl : ecl;

  const task = useTaskById();
  const { ticketNumber } = useParams();
  const useTicketQuery = useTicketByTicketNumber(ticketNumber, false);

  useDependantUpdates(
    uiSchema,
    idSchema,
    formContext,
    rootFormData,
    rootUiSchema,
    formData,
  );
  useExclusionUpdates(
    uiSchema,
    idSchema,
    formContext,
    rootFormData,
    rootUiSchema,
    formData,
  );

  const handleSelect = (conceptMini: ConceptMini | null) => {
    if (!conceptMini && uiSchema.defaultValue) {
      conceptMini = uiSchema.defaultValue;
    }

    const newValue = conceptMini ? { ...conceptMini } : null;

    setFormData(newValue);
    onChange(newValue);
  };

  const handleAddBrand = (brand: Concept) => {
    const newValue = {
      conceptId: brand.conceptId,
      pt: brand.pt || { term: brand.fsn?.term || 'Unnamed Brand' },
      fsn: brand.fsn || { term: brand.pt?.term || 'Unnamed Brand' },
    };

    if (isMultivalued) {
      const updatedList = [...(formData || []), newValue];
      setFormData(updatedList);
      onChange(updatedList);
    } else {
      setFormData(newValue);
      onChange(newValue);
    }

    setOpenCreateBrandModal(false);
  };

  const paddingRight = createBrand ? 5 : 0;

  return (
    <span data-component-name="AutoCompleteField">
      <Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            flex={50}
            sx={{ position: 'relative', paddingRight: paddingRight }}
          >
            {task?.branchPath &&
              (isMultivalued ? (
                <MultiValueEclAutocomplete
                  {...props}
                  ecl={currentEcl}
                  showDefaultOptions={isShowDefaultOptions}
                  value={formData}
                  isDisabled={disabled || props.disabled || false}
                  branch={task?.branchPath}
                  onChange={(val: ConceptMini[]) => {
                    setFormData(val);
                    onChange(val);
                  }}
                  errorMessage=""
                />
              ) : (
                <EclAutocomplete
                  {...props}
                  ecl={currentEcl}
                  showDefaultOptions={isShowDefaultOptions}
                  value={formData}
                  isDisabled={disabled || props.disabled || false}
                  branch={task?.branchPath}
                  onChange={handleSelect}
                  errorMessage=""
                />
              ))}
            {createBrand && (
              <Tooltip title="Create Brand">
                <IconButton
                  data-testid="create-brand-btn"
                  onClick={() => setOpenCreateBrandModal(true)}
                  sx={{
                    position: 'absolute',
                    right: '0px',
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
