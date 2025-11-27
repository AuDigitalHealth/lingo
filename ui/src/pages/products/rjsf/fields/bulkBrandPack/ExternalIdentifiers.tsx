import React, { useCallback, useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { FieldProps } from '@rjsf/utils';
import ValueSetAutocomplete from '../../components/ValueSetAutocomplete';
import EclAutocomplete from '../../components/EclAutocomplete';
import {
  BindingConfig,
  NonDefiningProperty,
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

import { ExternalIdentifierTextField } from '../../components/ExternalIdentifierTextField.tsx';

import { AdditionalFieldsEditor } from '../../components/AdditionalFieldsEditor.tsx';
import { isEmptyObjectByValue } from '../../../../../utils/helpers/conceptUtils.ts';
import {
  defaultForCheckBox,
  defaultsToNone,
  getFormDataById,
} from '../../helpers/helpers.ts';
import ChangeIndicator from '../../components/ChangeIndicator.tsx';
import LeftRightAlign from '../../components/LeftRightAlign.tsx';
import {
  compareByConceptId,
  compareByValue,
  compareByValueAndAdditional,
} from '../../helpers/comparator.ts';

export interface CreateConceptConfig {
  ecl: string;
  semanticTags: string;
  parentConceptId: string;
  parentConceptName: string;
  postfix: string | undefined;
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
  const {
    onChange,
    schema,
    uiSchema,
    registry,
    rawErrors,
    formContext,
    idSchema,
  } = props;
  const {
    optionsByScheme = {},
    schemeLimits = {},
    freeSoloByScheme = {},
    onChipClick,
    readOnly,
    propertyOrder = [],
  } = (uiSchema && uiSchema['ui:options']) || {};

  const formData = props.formData;

  const schemas = schema?.items?.anyOf as NonDefiningProperty[];
  const task = useTaskByKey();
  if (!schemas) {
    return null;
  }
  const title = schema?.title ?? 'Non-defining properties';

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
          {title}
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
                      formContext={formContext}
                      idSchema={idSchema}
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
  const {
    onChange,
    schema,
    uiSchema,
    registry,
    branch,
    rawErrors,
    formContext,
    idSchema,
  } = props;
  const {
    optionsByScheme = {},
    schemeLimits = {},
    freeSoloByScheme = {},
    onChipClick,
    readOnly,
  } = (uiSchema && uiSchema['ui:options']) || {};

  const schemeName = schema?.properties?.identifierScheme?.const;
  const dateFormat = schema?.properties?.value?.dateFormat;

  const task = useTaskByKey();
  const { ticketNumber } = useParams();
  const useTicketQuery = useTicketByTicketNumber(ticketNumber, false);
  const [availableOptions, setAvailableOptions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [errorTooltip, setErrorTooltip] = useState<string>('');
  const [createConceptModalOpen, setCreateConceptModalOpen] = useState(false);

  const [maxItems, setMaxItems] = useState<number>(9999);

  const info = schema.description;

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
  const showDiff =
    formContext?.mode === 'update' &&
    !isEmptyObjectByValue(formContext?.snowStormFormData);

  let originalSchemaEntries = [];
  if (showDiff) {
    const originalNonDefiningProperties = getFormDataById(
      formContext?.snowStormFormData,
      idSchema.$id,
    );
    originalSchemaEntries =
      originalNonDefiningProperties?.filter(
        f => f.identifierScheme === schema.properties.identifierScheme.const,
      ) || [];
  }

  const validTextFieldInput = (value: string) => {
    const pattern = schema.properties.value?.pattern;

    if (value && pattern && !new RegExp(`^${pattern}$`).test(value)) {
      const patternErrorMessage =
        schema.properties.value?.errorMessage?.pattern;
      if (patternErrorMessage) {
        setErrorTooltip(patternErrorMessage);
      } else {
        setErrorTooltip(
          `"${value}" does not match the required pattern "${pattern}".`,
        );
      }
      return false;
    }
    setErrorTooltip('');
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
          setErrorTooltip(patternErrorMessage);
        } else {
          setErrorTooltip(
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
        setErrorTooltip(`Identifier "${trimmed}" is already added.`);
        continue;
      }

      // Check if adding this item would exceed maxItems
      const currentCount = (formData?.length ?? 0) + newItems.length;
      if (maxItems && schemeEntries && currentCount >= maxItems) {
        setErrorTooltip(`Only ${maxItems} items allowed for ${schema.title}`);
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
  // Extract additionalFields schema to identify fields with enum
  const additionalFieldsSchema =
    schema?.properties?.additionalFields?.properties;

  const renderNonDefiningProperty = (
    <Stack
      direction="row"
      // spacing={2}
      alignItems="center"
      sx={{ width: '100%' }}
    >
      {useValueSetAutocomplete && isMultiValued && (
        <LeftRightAlign
          left={
            <MultiValueValueSetAutocomplete
              codeSystem={binding.codeSystem}
              label={schema.title}
              url={binding.valueSet || ''}
              showDefaultOptions={showDefaultOptions || false}
              value={schemeEntries.map(entry => entry.valueObject)}
              onChange={handleChangeConcepts}
              disabled={readOnly ? true : false}
              //   error={!!errorMessage}
              info={info}
            />
          }
          right={
            showDiff && (
              <ChangeIndicator
                value={schemeEntries.map(entry => entry.valueObject)}
                originalValue={originalSchemaEntries.map(
                  entry => entry.valueObject,
                )}
                comparator={compareByConceptId}
                alwaysShow={showDiff}
                id={schemeName}
              />
            )
          }
        />
      )}
      {useValueSetAutocomplete && !isMultiValued && (
        <LeftRightAlign
          left={
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
              info={info}
            />
          }
          right={
            showDiff && (
              <ChangeIndicator
                value={
                  schemeEntries[0]
                    ? schemeEntries[0].valueObject
                    : schemeEntries
                }
                originalValue={
                  originalSchemaEntries && originalSchemaEntries[0]
                    ? originalSchemaEntries[0].valueObject
                    : originalSchemaEntries
                }
                comparator={compareByConceptId}
                alwaysShow={showDiff}
                id={schemeName}
              />
            )
          }
        />
      )}
      {useEclAutocomplete && isMultiValued && (
        <LeftRightAlign
          left={
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
              info={info}
            />
          }
          right={
            showDiff && (
              <ChangeIndicator
                value={schemeEntries.map(entry => entry.valueObject)}
                originalValue={originalSchemaEntries.map(
                  entry => entry.valueObject,
                )}
                comparator={compareByConceptId}
                alwaysShow={showDiff}
                id={schemeName}
              />
            )
          }
        />
      )}
      {useEclAutocomplete && !isMultiValued && (
        <LeftRightAlign
          left={
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
              info={info}
            />
          }
          right={
            showDiff && (
              <ChangeIndicator
                value={
                  schemeEntries[0] ? schemeEntries[0].valueObject : undefined
                }
                originalValue={
                  originalSchemaEntries && originalSchemaEntries[0]
                    ? originalSchemaEntries[0].valueObject
                    : undefined
                }
                comparator={compareByConceptId}
                alwaysShow={showDiff}
                id={schemeName}
              />
            )
          }
        />
      )}
      {useCreateConcept && (
        <>
          <Tooltip title={`Create ${schema.title}`}>
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
            onAddPrimitive={handleAddCreatedConcept}
            uiSchema={props.uiSchema}
            branch={task?.branchPath as string}
            ticket={useTicketQuery.data as Ticket}
            ecl={binding.createConcept?.ecl}
            semanticTag={binding.createConcept?.semanticTags}
            parentConceptId={binding.createConcept?.parentConceptId}
            parentConceptName={binding.createConcept?.parentConceptName}
            postfix={binding.createConcept?.postfix}
          />
        </>
      )}
      {isCheckBox && ( // Checkbox implementation
        <LeftRightAlign
          leftSx={{
            flex: '0 0 auto', // shrink to fit content
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
          left={
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
          }
          right={
            showDiff && (
              <ChangeIndicator
                value={defaultForCheckBox(
                  formData?.some(
                    item =>
                      item.type === 'REFERENCE_SET' &&
                      item.identifierScheme ===
                        schema.properties.identifierScheme.const,
                  ),
                )}
                originalValue={defaultForCheckBox(
                  originalSchemaEntries?.some(
                    item =>
                      item.type === 'REFERENCE_SET' &&
                      item.identifierScheme ===
                        schema.properties.identifierScheme.const,
                  ),
                )}
                comparator={compareByValue}
                alwaysShow={showDiff}
                id={schemeName}
              />
            )
          }
        />
      )}
      {dateFormat && (
        <LeftRightAlign
          left={
            <DesktopDatePickerField
              label={schema.title}
              format={dateFormat}
              value={schemeEntries?.[0]?.value ? schemeEntries[0].value : null}
              onChange={handleDateChange}
              disabled={readOnly ? true : false}
              error={errorTooltip || missingRequiredFieldError}
              helperText={
                errorTooltip ||
                (missingRequiredFieldError ? 'Field must be populated' : info)
              }
            />
          }
          leftSx={{
            '& .MuiInputBase-root': {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            },
            '& .MuiInputAdornment-root': {
              marginRight: 0,
            },
          }}
          rightSx={{
            position: 'relative',
            top: '-10px',
          }}
          right={
            showDiff && (
              <ChangeIndicator
                value={schemeEntries[0] ? schemeEntries[0].value : undefined}
                originalValue={
                  originalSchemaEntries && originalSchemaEntries[0]
                    ? originalSchemaEntries[0].value
                    : undefined
                }
                comparator={compareByValue}
                alwaysShow={showDiff}
                id={schemeName}
              />
            )
          }
        />
      )}

      {!dateFormat &&
        !useEclAutocomplete &&
        !useValueSetAutocomplete &&
        !isCheckBox &&
        isMultiValued && (
          <LeftRightAlign
            left={
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
                  setErrorTooltip('');
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
                    error={errorTooltip || missingRequiredFieldError}
                    helperText={
                      errorTooltip ||
                      (missingRequiredFieldError
                        ? 'Field must be populated'
                        : info)
                    }
                    sx={{
                      '& .MuiFormHelperText-root': {
                        m: 0,
                        minHeight: '1em',
                        color:
                          errorTooltip || missingRequiredFieldError
                            ? 'error.main'
                            : 'text.secondary',
                      },
                    }}
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
            }
            right={
              showDiff && (
                <ChangeIndicator
                  value={schemeEntries.map(entry => entry.value)}
                  originalValue={originalSchemaEntries.map(
                    entry => entry.value,
                  )}
                  comparator={compareByValue}
                  alwaysShow={showDiff}
                  id={schemeName}
                />
              )
            }
          />
        )}
      {!dateFormat &&
        !useEclAutocomplete &&
        !useValueSetAutocomplete &&
        !isCheckBox &&
        !isMultiValued && (
          <LeftRightAlign
            left={
              <ExternalIdentifierTextField
                schema={schema}
                schemeName={schemeName}
                formData={formData}
                schemeEntries={schemeEntries}
                readOnly={readOnly}
                errorTooltip={errorTooltip}
                missingRequiredFieldError={missingRequiredFieldError}
                info={info}
                onChange={onChange}
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleTextFieldInputChange={handleTextFieldInputChange}
              />
            }
            right={
              showDiff && (
                <ChangeIndicator
                  value={defaultsToNone(
                    schemeEntries[0] ? schemeEntries[0].value : undefined,
                  )}
                  originalValue={defaultsToNone(
                    originalSchemaEntries[0]
                      ? originalSchemaEntries[0].value
                      : undefined,
                  )}
                  comparator={compareByValue}
                  alwaysShow={showDiff}
                  id={schemeName}
                />
              )
            }
          />
        )}
    </Stack>
  );

  return (
    <Box>
      {additionalFieldsSchema ? (
        <LeftRightAlign
          left={
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
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
                sx={{
                  minHeight: 32,
                  paddingY: 0.5,
                  paddingX: 1.25,
                  '&.Mui-expanded': {
                    minHeight: 32,
                  },
                  '& .MuiAccordionSummary-content': {
                    marginY: 0.25,
                  },
                  '& .MuiAccordionSummary-expandIconWrapper': {
                    marginTop: '0 !important',
                    marginBottom: '0 !important',
                  },
                }}
              >
                {schema.title}
              </AccordionSummary>

              <AccordionDetails>
                <AdditionalFieldsEditor
                  formData={formData}
                  schemeEntries={schemeEntries}
                  readOnly={readOnly}
                  info={info}
                  schema={schema}
                  errorTooltip={errorTooltip}
                  setErrorTooltip={setErrorTooltip}
                  missingRequiredFieldError={missingRequiredFieldError}
                  schemeName={schemeName}
                  onChange={onChange}
                  maxItems={100}
                  isMultivalued={isMultiValued}
                ></AdditionalFieldsEditor>
              </AccordionDetails>
            </Accordion>
          }
          right={
            showDiff && (
              <ChangeIndicator
                value={schemeEntries}
                originalValue={originalSchemaEntries}
                comparator={compareByValueAndAdditional}
                alwaysShow={showDiff}
                id={schemeName}
              />
            )
          }
        />
      ) : (
        renderNonDefiningProperty
      )}
    </Box>
  );
};

export default ExternalIdentifiers;
