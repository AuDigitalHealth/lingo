import React, { useCallback, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  TextField,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { FieldProps } from '@rjsf/utils';
import ValueSetAutocomplete from '../../components/ValueSetAutocomplete';
import EclAutocomplete from '../../components/EclAutocomplete';
import {
  NonDefiningProperty,
  NonDefiningPropertyType,
} from '../../../../../types/product.ts';
import useTaskByKey from '../../../../../hooks/useTaskByKey.tsx';
import { Concept, ConceptMini } from '../../../../../types/concept.ts';
import { MultiValueValueSetAutocomplete } from '../../components/MultiValueSetAutocomplete.tsx';
import MultiValueEclAutocomplete from '../../components/MultiValueEclAutocomplete.tsx';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DesktopDatePickerField from '../../components/DesktopDatePickerField.tsx';
import { Tooltip } from 'antd';
import CreatePrimitiveConcept from '../../components/CreatePrimitiveConcept.tsx';
import { useTicketByTicketNumber } from '../../../../../hooks/api/tickets/useTicketById.tsx';
import { useParams } from 'react-router-dom';
import { Ticket } from '../../../../../types/tickets/ticket.ts';
import { ErrorObject } from 'ajv';
import { PREFIX_MISSING_NONDEFINING_PROPERTIES } from '../../helpers/validationHelper.ts';

const SCHEME_COLORS = ['primary', 'secondary', 'success', 'error', 'warning'];

const getColorByScheme = (scheme: string) => {
  const index =
    scheme?.split('').reduce((a, b) => a + b.charCodeAt(0), 0) %
    SCHEME_COLORS.length;
  return SCHEME_COLORS[index];
};
//
// interface ExternalIdentifier {
//   identifierScheme: string;
//   relationshipType: string;
//   identifierValue: string;
// }

interface NonDefiningPropertyDefinition {
  identifierScheme: string;
  relationshipType: string;
  valueObject: string;
  value: string;
  type: NonDefiningPropertyType;
}

interface BindingConfig {
  [key: string]: {
    valueSet?: string;
    ecl?: string;
    showDefaultOptions?: boolean;
    createConcept?: CreateConceptConfig;
    placeholder?: string;
  };
}

export interface CreateConceptConfig {
  ecl: string;
  semanticTags: string;
  parentConceptId: string;
  parentConceptName: string;
}

// Helper function to extract errors for a specific scheme

const isMissingMandatoryField = (
  rawErrors: ErrorObject[] | undefined,
  schemeName: string,
): boolean => {
  if (!rawErrors || !rawErrors.length) return false;

  const errorMessage = rawErrors[0];

  if (errorMessage.startsWith(PREFIX_MISSING_NONDEFINING_PROPERTIES)) {
    const fieldsStr = errorMessage
      .slice(PREFIX_MISSING_NONDEFINING_PROPERTIES.length)
      .trim();
    const fields = fieldsStr.split(',').map(s => s.trim());
    return fields.includes(schemeName);
  }

  return false;
};
const ExternalIdentifiers: React.FC<
  FieldProps<NonDefiningProperty[]>
> = props => {
  const { onChange, schema, uiSchema, registry, rawErrors } = props;
  const {
    optionsByScheme = {},
    schemeLimits = {},
    freeSoloByScheme = {},
    onChipClick,
    readOnly,
    propertyOrder = [],
  } = (uiSchema && uiSchema['ui:options']) || {};

  const formData = props.formData;

  const schemas = schema?.items?.anyOf as NonDefiningPropertyDefinition[];
  const task = useTaskByKey();
  if (!schemas) {
    return null;
  }

  return (
    <>
      <Accordion
        defaultExpanded
        sx={{
          backgroundColor: '#fdfcfc',
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          boxShadow: 'none',
          mt: 2,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ fontWeight: 'bold' }}
        >
          Non-defining properties
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {schemas
              .sort((a, b) => {
                const aScheme = a.properties?.identifierScheme?.const || '';
                const bScheme = b.properties?.identifierScheme?.const || '';
                const aIdx = propertyOrder.indexOf(aScheme);
                const bIdx = propertyOrder.indexOf(bScheme);
                if (aIdx !== -1 && bIdx !== -1) {
                  return aIdx - bIdx; // Sort by propertyOrder index
                }
                return aScheme.localeCompare(bScheme);
              })
              .filter(
                schema =>
                  !uiSchema['ui:options']?.readOnlyProperties?.includes(
                    schema.properties.identifierScheme.const,
                  ),
              )
              .map((schema, index) => {
                return (
                  <Grid item xs={12} md={6} key={index}>
                    <ExternalIdentifierRender
                      sx={{ margin: 1 }}
                      formData={formData}
                      onChange={updated => {
                        onChange(updated);
                      }}
                      schema={schema}
                      uiSchema={uiSchema}
                      registry={registry}
                      branch={task?.branchPath}
                      rawErrors={rawErrors}
                    />
                  </Grid>
                );
              })}
          </Grid>
        </AccordionDetails>
      </Accordion>
    </>
  );
};
interface ExternalIdentifierRenderProps
  extends FieldProps<NonDefiningProperty[]> {
  branch: string | undefined;
}
const ExternalIdentifierRender: React.FC<
  ExternalIdentifierRenderProps
> = props => {
  const { onChange, schema, uiSchema, registry, branch, rawErrors } = props;
  const {
    optionsByScheme = {},
    schemeLimits = {},
    freeSoloByScheme = {},
    onChipClick,
    readOnly,
  } = (uiSchema && uiSchema['ui:options']) || {};

  const schemeName = schema?.properties?.identifierScheme?.const;
  const dateFormat = schema?.properties?.value?.dateFormat;
  const pattern = schema?.properties?.value?.pattern;

  const task = useTaskByKey();
  const { ticketNumber } = useParams();
  const useTicketQuery = useTicketByTicketNumber(ticketNumber, false);
  const [availableOptions, setAvailableOptions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [tooltip, setTooltip] = useState<string>('');
  const [createConceptModalOpen, setCreateConceptModalOpen] = useState(false);

  const [maxItems, setMaxItems] = useState<number>(9999);
  const [freeSolo, setFreeSolo] = useState<boolean>(true);

  const formData = props.formData;
  const multiValuedSchemes: string[] =
    uiSchema['ui:options']?.multiValuedSchemes || [];

  const showDefaultOptionSchemes: string[] =
    uiSchema['ui:options']?.showDefaultOptionSchemes || [];

  const mandatorySchemes: string[] =
    uiSchema['ui:options']?.mandatorySchemes || [];
  const isRequired = mandatorySchemes.includes(schemeName);

  const isMultiValued = multiValuedSchemes.includes(schemeName);
  const showDefaultOptions = showDefaultOptionSchemes.includes(schemeName);
  const isCheckBox = schema?.properties?.type?.const === 'REFERENCE_SET';
  const isNumber = schema?.properties?.value?.type === 'number';

  const bindingConfig: BindingConfig = uiSchema['ui:options']?.binding || {};

  const hasValueSetBinding = (scheme: string): boolean =>
    !!bindingConfig[scheme]?.valueSet;

  const hasEclBinding = (scheme: string): boolean =>
    !!bindingConfig[scheme]?.ecl;

  const hasCreateConcept = (scheme: string): boolean =>
    !!bindingConfig[scheme]?.createConcept;

  const missingRequiredFieldError = isMissingMandatoryField(
    rawErrors,
    schemeName,
  );

  const useValueSetAutocomplete = hasValueSetBinding(schemeName);
  const useEclAutocomplete = hasEclBinding(schemeName);
  const useCreateConcept = hasCreateConcept(schemeName);

  const binding = bindingConfig[schemeName] || {};

  const schemeEntries =
    formData?.filter(
      f => f.identifierScheme === schema.properties.identifierScheme.const,
    ) || [];
  if (isNumber) {
    schemeEntries.forEach(entry => {
      if (entry?.value !== undefined && entry?.value !== null) {
        const num = Number(entry.value);
        entry.value = isNaN(num) ? entry.value : num;
      }
    });
  }

  const validTextFieldInput = (value: string) => {
    const pattern = schema.properties.value?.pattern;

    if (value && pattern && !new RegExp(`^${pattern}$`).test(value)) {
      const patternErrorMessage =
        schema.properties.value?.errorMessage?.pattern;
      if (patternErrorMessage) {
        setTooltip(patternErrorMessage);
      } else {
        setTooltip(
          `"${value}" does not match the required pattern "${pattern}".`,
        );
      }
      return false;
    }
    setTooltip('');
    return true;
  };
  const handleAdd = (value: string | string[]) => {
    // Convert single string to array for uniform processing
    const values = Array.isArray(value) ? value : [value];

    const newItems: NonDefiningProperty[] = [];
    const pattern = schema.properties.value?.pattern;

    for (const val of values) {
      const trimmed = val.trim();
      if (!trimmed) continue; // Skip empty strings

      // Check regex pattern validation
      if (pattern && !new RegExp(`^${pattern}$`).test(trimmed)) {
        const patternErrorMessage =
          schema.properties.value?.errorMessage?.pattern;
        if (patternErrorMessage) {
          setTooltip(patternErrorMessage);
        } else {
          setTooltip(
            `"${trimmed}" does not match the required pattern "${pattern}".`,
          );
        }
        continue;
      }

      // Check if this identifier already exists
      if (
        formData?.some(
          item =>
            item.value === trimmed &&
            item.identifierScheme === schema.properties.identifierScheme.const,
        )
      ) {
        setTooltip(`Identifier "${trimmed}" is already added.`);
        continue;
      }

      // Check if adding this item would exceed maxItems
      const currentCount = (formData?.length ?? 0) + newItems.length;
      if (maxItems && schemeEntries && currentCount >= maxItems) {
        setTooltip(`Only ${maxItems} items allowed for ${schema.title}`);
        break;
      }

      const testObj: NonDefiningProperty = {
        identifierScheme: schema.properties.identifierScheme.const,
        relationshipType: schema.properties.relationshipType?.const ?? null,
        type: schema.properties.type?.const ?? null,
        value: trimmed,
      };

      newItems.push(testObj);
    }

    // Only update if we have new items to add
    if (newItems.length > 0) {
      const newFormData = [...(formData ?? []), ...newItems];
      onChange(newFormData);
    }
  };
  const handleDateChange = (newDate: string | null) => {
    const updatedEntry: NonDefiningProperty = {
      identifierScheme: schemeName,
      type: schema.properties.type?.const ?? null,
      value: newDate ?? '',
    };

    const filtered = (formData ?? []).filter(
      item => item.identifierScheme !== schemeName,
    );

    const newData = newDate ? [...filtered, updatedEntry] : filtered;
    onChange(newData);
  };

  const handleDelete = (value: string, scheme: string) => {
    const returnFormData = formData?.filter(item => {
      const returnVal = !(
        item.value === value && item.identifierScheme === scheme
      );
      return returnVal;
    });
    onChange(returnFormData);
  };
  const handleChangeConcepts = (
    concepts: ConceptMini | ConceptMini[] | Concept | null,
  ) => {
    const scheme = schema.properties.identifierScheme.const;

    // Normalize to array
    const conceptList = !concepts
      ? []
      : Array.isArray(concepts)
        ? concepts
        : [concepts];

    // If null or empty → remove all entries for this scheme
    if (conceptList.length === 0) {
      const cleared = (formData ?? []).filter(
        item => item.identifierScheme !== scheme,
      );
      onChange(cleared);
      return;
    }

    // Build new entries for this scheme
    const newEntries: NonDefiningProperty[] = conceptList
      .map(concept => {
        const conceptId = concept.conceptId?.trim();
        if (!conceptId) return null;
        return {
          identifierScheme: scheme,
          relationshipType: schema.properties.relationshipType?.const,
          type: schema.properties.type.const,
          valueObject: concept,
        };
      })
      .filter(Boolean) as NonDefiningProperty[];

    // Keep all other entries
    const others = (formData ?? []).filter(
      item => item.identifierScheme !== scheme,
    );

    onChange([...others, ...newEntries]);
  };

  const handleTextFieldInputChange = useCallback(() => {
    const val = inputValue.trim();

    if (val === '') {
      onChange(
        (formData ?? []).filter(item => item.identifierScheme !== schemeName),
      );
    } else if (validTextFieldInput(val)) {
      const updatedEntry: NonDefiningProperty = {
        identifierScheme: schemeName,
        relationshipType: schema.properties.relationshipType?.const ?? null,
        type: schema.properties.type?.const ?? null,
        value: isNumber ? Number(val) : val,
      };
      const others = (formData ?? []).filter(
        item => item.identifierScheme !== schemeName,
      );
      onChange([...others, updatedEntry]);
    } else {
      onChange(
        (formData ?? []).filter(item => item.identifierScheme !== schemeName),
      );
      setInputValue('');
    }
  }, [
    inputValue,
    formData,
    schema,
    schemeName,
    isNumber,
    onChange,
    validTextFieldInput,
  ]);

  const handleAddCreatedConcept = (createdConcept: Concept) => {
    handleChangeConcepts(createdConcept);
  };

  const renderChip = (item: NonDefiningProperty) => (
    <Tooltip title={item.value} placement="top">
      <Chip
        variant="filled"
        key={`${item.identifierScheme}-${item.value}`}
        label={item.value}
        onDelete={
          !readOnly
            ? () => handleDelete(item.value, item.identifierScheme)
            : undefined
        }
        sx={{
          maxWidth: '200px', // Constrain chip width
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      />
    </Tooltip>
  );

  if (readOnly && (!schemeEntries || schemeEntries.length === 0)) {
    return <></>;
  }
  return (
    <Box>
      <Stack
        direction="row"
        // spacing={2}
        alignItems="center"
        sx={{ width: '100%' }}
      >
        {useValueSetAutocomplete && isMultiValued && (
          <MultiValueValueSetAutocomplete
            label={schema.title}
            url={binding.valueSet || ''}
            showDefaultOptions={showDefaultOptions || false}
            value={schemeEntries.map(entry => entry.valueObject)}
            onChange={handleChangeConcepts}
            disabled={readOnly ? true : false}
            //   error={!!errorMessage}
          />
        )}
        {useValueSetAutocomplete && !isMultiValued && (
          <ValueSetAutocomplete
            label={schema.title}
            url={binding.valueSet || ''}
            showDefaultOptions={showDefaultOptions || false}
            value={
              schemeEntries[0] ? schemeEntries[0].valueObject : schemeEntries
            }
            onChange={handleChangeConcepts}
            disabled={readOnly ? true : false}
            required={isRequired}
            errorMessage={
              missingRequiredFieldError ? 'Field must be populated' : ''
            }
          />
        )}
        {useEclAutocomplete && isMultiValued && (
          <MultiValueEclAutocomplete
            value={schemeEntries.map(entry => entry.valueObject)}
            ecl={binding.ecl || ''}
            branch={branch}
            onChange={handleChangeConcepts}
            showDefaultOptions={showDefaultOptions || false}
            isDisabled={readOnly ? true : false}
            errorMessage={
              missingRequiredFieldError ? 'Field must be populated' : ''
            }
            title={schema.title}
            required={isRequired}
          />
        )}
        {useEclAutocomplete && !isMultiValued && (
          <EclAutocomplete
            value={
              schemeEntries[0] ? schemeEntries[0].valueObject : schemeEntries
            }
            ecl={binding.ecl || ''}
            branch={branch}
            onChange={handleChangeConcepts}
            showDefaultOptions={showDefaultOptions || false}
            isDisabled={readOnly ? true : false}
            errorMessage={
              missingRequiredFieldError ? 'Field must be populated' : ''
            }
            required={isRequired}
            title={schema.title}
          />
        )}
        {useCreateConcept && (
          <>
            <Tooltip title="Create Primitive Concept">
              <IconButton
                data-testid="create-brand-btn"
                onClick={() => setCreateConceptModalOpen(true)}
                disabled={false}
                tabIndex={-1}
              >
                <AddCircleOutlineIcon color="primary" />
              </IconButton>
            </Tooltip>
            <CreatePrimitiveConcept
              open={createConceptModalOpen}
              title={schema.title}
              onClose={() => setCreateConceptModalOpen(false)}
              onAddBrand={handleAddCreatedConcept}
              uiSchema={props.uiSchema}
              branch={task?.branchPath as string}
              ticket={useTicketQuery.data as Ticket}
              ecl={binding.createConcept?.ecl}
              semanticTag={binding.createConcept?.semanticTags}
              parentConceptId={binding.createConcept?.parentConceptId}
              parentConceptName={binding.createConcept?.parentConceptName}
            />
          </>
        )}
        {isCheckBox && ( // Checkbox implementation
          <FormControlLabel
            label={schema.title}
            labelPlacement="start"
            control={
              <Checkbox
                checked={formData?.some(
                  item =>
                    item.type === 'REFERENCE_SET' &&
                    item.identifierScheme ===
                      schema.properties.identifierScheme.const,
                )}
                onChange={e => {
                  const scheme = schema.properties.identifierScheme.const;
                  const updated = e.target.checked
                    ? [
                        ...(formData || []),
                        { type: 'REFERENCE_SET', identifierScheme: scheme },
                      ]
                    : formData?.filter(
                        item =>
                          !(
                            item.type === 'REFERENCE_SET' &&
                            item.identifierScheme === scheme
                          ),
                      ) || [];
                  onChange(updated);
                }}
                disabled={readOnly}
              />
            }
          />
        )}
        {dateFormat && (
          <DesktopDatePickerField
            label={schema.title}
            format={dateFormat}
            value={schemeEntries?.[0]?.value ? schemeEntries[0].value : null}
            onChange={handleDateChange}
            disabled={readOnly ? true : false}
            error={tooltip || missingRequiredFieldError}
            helperText={
              tooltip ||
              (missingRequiredFieldError ? 'Field must be populated' : '')
            }
          />
        )}

        {!dateFormat &&
          !useEclAutocomplete &&
          !useValueSetAutocomplete &&
          !isCheckBox &&
          isMultiValued && (
            <Autocomplete
              multiple
              freeSolo
              disableClearable
              filterSelectedOptions
              disabled={readOnly}
              options={availableOptions}
              getOptionLabel={option => option}
              value={schemeEntries?.map(e => e.value)}
              inputValue={inputValue}
              onInputChange={(_, newVal) => {
                setInputValue(newVal);
                setTooltip('');
              }}
              onChange={(_, values, reason, details) => {
                if (reason === 'selectOption' && details?.option) {
                  handleAdd(details.option);
                } else if (reason === 'createOption') {
                  handleAdd(values[values.length - 1]);
                }
              }}
              renderTags={(values, getTagProps) => (
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {values.map((val, index) => (
                    <React.Fragment key={`${schemeName}-${val}-${index}`}>
                      {renderChip({
                        value: val,
                        identifierScheme: schemeName,
                        relationshipType:
                          schema.properties.relationshipType?.const,
                      })}
                    </React.Fragment>
                  ))}
                </Stack>
              )}
              renderInput={params => (
                <TextField
                  {...params}
                  onBlur={() => {
                    const trimmed = inputValue.trim();
                    if (trimmed && !readOnly) {
                      handleAdd(trimmed);
                      setInputValue('');
                    }
                  }}
                  label={schema.title}
                  error={tooltip || missingRequiredFieldError}
                  helperText={
                    tooltip ||
                    (missingRequiredFieldError ? 'Field must be populated' : '')
                  }
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {params.InputProps.endAdornment}
                        {!readOnly && inputValue?.trim() && (
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => {
                              handleAdd(inputValue.trim());
                              setInputValue('');
                            }}
                            disabled={schemeEntries.some(
                              entry => entry.value === inputValue.trim(),
                            )}
                            sx={{ ml: 1 }}
                            title="Add value"
                          >
                            <AddCircleOutlineIcon color="primary" />
                          </IconButton>
                        )}
                      </>
                    ),
                  }}
                />
              )}
              sx={{ width: '100%' }}
            />
          )}
        {!dateFormat &&
          !useEclAutocomplete &&
          !useValueSetAutocomplete &&
          !isCheckBox &&
          !isMultiValued && (
            <TextField
              fullWidth
              type={isNumber ? 'number' : 'text'}
              disabled={readOnly}
              label={schema.title}
              value={inputValue ? inputValue : schemeEntries?.[0]?.value || ''}
              onChange={e => {
                const val = e.target.value;
                if (val === '') {
                  // Remove the entry if value is cleared
                  onChange(
                    (formData ?? []).filter(
                      item => item.identifierScheme !== schemeName,
                    ),
                  );
                }
                setInputValue(e.target.value);
              }}
              onBlur={handleTextFieldInputChange}
              InputProps={{
                inputProps: {
                  step: isNumber ? '0.01' : undefined,
                },
              }}
              error={tooltip || missingRequiredFieldError}
              helperText={
                tooltip ||
                (missingRequiredFieldError ? 'Field must be populated' : '')
              }
            />
          )}
      </Stack>
    </Box>
  );
};

export default ExternalIdentifiers;
