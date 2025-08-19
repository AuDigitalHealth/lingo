import React, { useEffect, useState } from 'react';
import { FieldProps } from '@rjsf/utils';
import { Box, IconButton, Tooltip } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Concept, ConceptMini } from '../../../../types/concept.ts';
import { SetExtendedEclButton } from '../../components/SetExtendedEclButton.tsx';
import EclAutocomplete from '../components/EclAutocomplete.tsx';
import MultiValueEclAutocomplete from '../components/MultiValueEclAutocomplete.tsx';
import CreatePrimitiveConcept from '../components/CreatePrimitiveConcept.tsx';
import useTaskByKey from '../../../../hooks/useTaskByKey.tsx';
import { useTicketByTicketNumber } from '../../../../hooks/api/tickets/useTicketById.tsx';
import { useParams } from 'react-router-dom';
import { Ticket } from '../../../../types/tickets/ticket.ts';
import { useDependantUpdates } from './../hooks/useDependantUpdates.ts';
import { useExclusionUpdates } from './../hooks/useExclusionUpdates.ts';
import { RjsfUtils } from '../helpers/rjsfUtils';
import { CreateConceptConfig } from './bulkBrandPack/ExternalIdentifiers.tsx';

const AutoCompleteField: React.FC<FieldProps<any, any>> = props => {
  const { onChange, idSchema } = props;

  const [rootUiSchema, setRootUiSchema] = useState(
    props?.formContext?.uiSchema || {},
  );

  /** Always read the latest ui:options from the per-item path */
  const getUiOptions = () => {
    const optionsFromPath = RjsfUtils.getUiSchemaItemByIndex(
      rootUiSchema,
      idSchema.$id,
    );
    if (optionsFromPath && Object.keys(optionsFromPath).length > 0) {
      if (
        optionsFromPath?.['ui:options'] &&
        Object.keys(optionsFromPath?.['ui:options']).length > 0
      ) {
        return optionsFromPath?.['ui:options'] || {};
      } else {
        return optionsFromPath;
      }
    }
    // Fallback to default ui:options from props.uiSchema
    return props.uiSchema?.['ui:options'] || {};
  };

  const uiOptions = getUiOptions();

  const isMultivalued = uiOptions?.multiValued === true;
  const isShowDefaultOptions = uiOptions?.showDefaultOptions === true;
  const { ecl, extendedEcl, disabled, defaultValue } = uiOptions || {};

  const [formData, setFormData] = useState(
    props.formData ?? (isMultivalued ? [] : null),
  );
  const [rootFormData, setRootFormData] = useState(
    props.formData ?? (isMultivalued ? [] : null),
  );
  const [formContext, setFormContext] = useState(props.formContext || {});

  useEffect(() => {
    const data = props.formData ?? (isMultivalued ? [] : null);
    setFormData(data);
    setRootFormData(data);
  }, [props.formData, isMultivalued]);

  useEffect(() => {
    setFormContext(props.formContext || {});
    setRootUiSchema(props?.formContext?.uiSchema || {});
  }, [props.formContext]);

  const [openCreateBrandModal, setOpenCreateBrandModal] = useState(false);
  const [localExtendedEcl, setLocalExtendedEcl] = useState<boolean>(false);
  const currentEcl = localExtendedEcl ? extendedEcl : ecl;

  const task = useTaskByKey();
  const { ticketNumber } = useParams();
  const useTicketQuery = useTicketByTicketNumber(ticketNumber, false);

  useDependantUpdates(
    props.uiSchema,
    idSchema,
    formContext,
    rootFormData,
    rootUiSchema,
    formData,
  );
  useExclusionUpdates(
    props.uiSchema,
    idSchema,
    formContext,
    rootFormData,
    rootUiSchema,
    formData,
  );

  const handleSelect = (conceptMini: ConceptMini | null) => {
    if (!conceptMini && defaultValue) {
      conceptMini = defaultValue;
    }
    const newValue = conceptMini ? { ...conceptMini } : null;
    setFormData(newValue);
    onChange(newValue);
  };

  const addPrimitive = (brand: Concept) => {
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
  const createPrimitiveConcept =
    (uiOptions?.createPrimitiveConcept as CreateConceptConfig) || undefined;
  const createPrimitiveEcl = createPrimitiveConcept?.ecl;
  const createPrimitiveSemanticTag = createPrimitiveConcept?.semanticTags || '';
  const createParentConceptId = createPrimitiveConcept?.parentConceptId || '';
  const createParentConceptName =
    createPrimitiveConcept?.parentConceptName || '';

  const paddingRight = createPrimitiveConcept ? 5 : 0;
  const isDisabled = disabled || props.disabled || false;

  return (
    <span data-component-name="AutoCompleteField">
      <Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box flex={50} sx={{ position: 'relative', paddingRight }}>
            {task?.branchPath &&
              (isMultivalued ? (
                <MultiValueEclAutocomplete
                  {...props}
                  ecl={currentEcl}
                  showDefaultOptions={isShowDefaultOptions}
                  value={formData}
                  isDisabled={isDisabled}
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
                  isDisabled={isDisabled}
                  branch={task?.branchPath}
                  onChange={handleSelect}
                  turnOffPublishParam={createPrimitiveConcept ? true : false}
                />
              ))}
            {createPrimitiveConcept && (
              <Tooltip title="Create Brand">
                <IconButton
                  data-testid="create-brand-btn"
                  onClick={() => setOpenCreateBrandModal(true)}
                  sx={{
                    position: 'absolute',
                    right: '0px',
                    top: '0',
                  }}
                  disabled={isDisabled}
                  tabIndex={-1}
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
        {createPrimitiveConcept && (
          <CreatePrimitiveConcept
            open={openCreateBrandModal}
            onClose={() => setOpenCreateBrandModal(false)}
            onAddPrimitive={addPrimitive}
            uiSchema={props.uiSchema}
            branch={task?.branchPath as string}
            ticket={useTicketQuery.data as Ticket}
            ecl={createPrimitiveEcl as string}
            semanticTag={createPrimitiveSemanticTag as string}
            parentConceptId={createParentConceptId as string}
            parentConceptName={createParentConceptName as string}
          />
        )}
      </Box>
    </span>
  );
};

export default AutoCompleteField;
