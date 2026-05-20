import { Product, ProductSummary } from '../../../types/concept.ts';
import {
  Control,
  Controller,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
  useFieldArray,
  useWatch,
} from 'react-hook-form';
import {
  FormControlLabel,
  FormHelperText,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { InnerBoxSmall } from './style/ProductBoxes.tsx';
import {
  createDefaultDescription,
  filterKeypress,
  findDefaultLangRefset,
  setEmptyToNull,
} from '../../../utils/helpers/conceptUtils.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';
import {
  replaceAllWithWhiteSpace,
  normalizeWhitespace,
} from '../../../types/productValidationUtils.ts';
import { convertStringToRegex } from '../../../utils/helpers/stringUtils.ts';
import {
  getValueFromFieldBindings,
  resolvePreferredTermMaxLength,
} from '../../../utils/helpers/FieldBindingUtils.ts';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import AdditionalPropertiesDisplay from './AdditionalPropertiesDisplay.tsx';
import { ProductRetireUpdate } from './ProductRetireUpdate.tsx';
import {
  extractSemanticTag,
  removeSemanticTagFromTerm,
} from '../../../utils/helpers/ProductPreviewUtils.ts';
import { ContentCopy, DeleteOutlined } from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';
import useAvailableProjects from '../../../hooks/api/useInitializeProjects.tsx';
import useApplicationConfigStore from '../../../stores/ApplicationConfigStore.ts';
import { PlusCircleOutlined } from '@ant-design/icons';
import { IconButton } from '@mui/material';
import { Button } from '@mui/material';
import useProjectLangRefsets from '../../../hooks/api/products/useProjectLangRefsets.tsx';
import { useProjectFromUrlTaskPath } from '../../../hooks/useProjectFromUrlPath.tsx';
import { useAllSynonymConfigurations } from '../../../hooks/api/tickets/useUpdateSynonymConfiguration.tsx';

interface NewConceptDropdownProps {
  product: Product;
  index: number;
  register: UseFormRegister<ProductSummary>;
  getValues: UseFormGetValues<ProductSummary>;
  control: Control<ProductSummary>;
  fieldBindings: FieldBindings;
  branch: string;
  setValue?: UseFormSetValue<ProductSummary>;
}

function NewConceptDropdown({
  product,
  index,
  register,
  getValues,
  control,
  fieldBindings,
  branch,
  setValue,
}: NewConceptDropdownProps) {
  const semanticTag = product.newConceptDetails?.semanticTag;

  const initialStatusRef = useRef(
    product.newConceptDetails?.axioms[0].definitionStatus ?? 'PRIMITIVE',
  );
  const [currentStatus, setCurrentStatus] = useState(initialStatusRef.current);
  const [specificConceptIdError, setSpecificConceptIdError] = useState('');
  const project = useProjectFromUrlTaskPath();
  const langRefsets = useProjectLangRefsets({ project });
  const defaultLangRefset = findDefaultLangRefset(langRefsets);
  const langRefsetCode = defaultLangRefset?.en;
  return (
    <div key={'div-' + product.conceptId}>
      <Grid item xs={12}>
        <Grid item xs={12}>
          <Controller
            name={
              `nodes[${index}].newConceptDetails.axioms.0.definitionStatus` as const
            }
            control={control}
            render={({ field }) => (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value === 'FULLY_DEFINED'}
                      onChange={(_, checked: boolean) => {
                        const status = checked ? 'FULLY_DEFINED' : 'PRIMITIVE';
                        field.onChange(status);
                        setCurrentStatus(status);
                        setValue?.(
                          `nodes.${index}.newConceptDetails.axioms.0.definitionStatusId`,
                          checked ? '900000000000073002' : '900000000000074008',
                        );
                      }}
                      color="primary"
                    />
                  }
                  label={
                    field.value === 'FULLY_DEFINED'
                      ? 'Fully Defined'
                      : 'Primitive'
                  }
                />
                {currentStatus !== initialStatusRef.current && (
                  <FormHelperText
                    sx={{ color: t => `${t.palette.warning.main}` }}
                  >
                    Warning: You have changed the definition status from its
                    calculated value.
                  </FormHelperText>
                )}
              </>
            )}
          />
          <NewConceptDropdownField
            fieldName={`nodes[${index}].newConceptDetails.fullySpecifiedName`}
            originalValue={
              product.newConceptDetails?.fullySpecifiedName as string
            }
            register={register}
            legend={'FSN'}
            getValues={getValues}
            dataTestId={`fsn-input`}
            control={control}
            fieldBindings={fieldBindings}
            semanticTag={semanticTag}
            langRefsetCode={langRefsetCode}
          />
        </Grid>
        <NewConceptDropdownField
          fieldName={`nodes[${index}].newConceptDetails.preferredTerm`}
          originalValue={product.newConceptDetails?.preferredTerm as string}
          register={register}
          legend={'Preferred Term'}
          getValues={getValues}
          dataTestId={`pt-input`}
          control={control}
          fieldBindings={fieldBindings}
          langRefsetCode={langRefsetCode}
        />
        <AdditionalSynonymField
          index={index}
          fieldName={`nodes[${index}].newConceptDetails.descriptions`}
          register={register}
          dataTestId={`pt-input`}
          control={control}
          setValue={setValue}
          product={product}
          getValues={getValues}
        />
        <InnerBoxSmall component="fieldset">
          <legend>Specified Concept Id</legend>
          <TextField
            {...register(
              `nodes[${index}].newConceptDetails.specifiedConceptId` as 'nodes.0.newConceptDetails.specifiedConceptId',
              { required: false, setValueAs: setEmptyToNull },
            )}
            fullWidth
            variant="outlined"
            margin="dense"
            InputLabelProps={{ shrink: true }}
            onKeyDown={filterKeypress}
            onBlur={e => {
              const val = e.target.value.trim();
              if (val !== '' && !/^\d+$/.test(val)) {
                e.target.value = '';
                setSpecificConceptIdError('Invalid Concept Id');
                setValue(
                  `nodes[${index}].newConceptDetails.specifiedConceptId` as 'nodes.0.newConceptDetails.specifiedConceptId',
                  null,
                );
              } else {
                setSpecificConceptIdError('');
              }
            }}
            error={!!specificConceptIdError}
            helperText={specificConceptIdError}
          />
        </InnerBoxSmall>
        {setValue && (
          <ProductRetireUpdate
            product={product}
            control={control}
            index={index}
            setValue={setValue}
            branch={branch}
          />
        )}

        <AdditionalPropertiesDisplay product={product} branch={branch} />
      </Grid>
    </div>
  );
}

interface AdditionalSynonymFieldProps {
  register: UseFormRegister<ProductSummary>;
  fieldName: string;
  dataTestId: string;
  control: Control<ProductSummary>;
  setValue?: UseFormSetValue<ProductSummary>;
  product: Product;
  getValues: UseFormGetValues<ProductSummary>;
  index: number;
}

function AdditionalSynonymField({
  register,
  fieldName,
  dataTestId,
  control,
  setValue,
  product,
  index,
  getValues,
}: AdditionalSynonymFieldProps) {
  // Use useFieldArray to manage the array of descriptions
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName as 'nodes.0.newConceptDetails.descriptions',
  });

  const { data: projects } = useAvailableProjects();
  const { applicationConfig } = useApplicationConfigStore();

  const project = useProjectFromUrlTaskPath();

  const langRefsets = useProjectLangRefsets({ project: project });

  const defaultLangRefset = findDefaultLangRefset(langRefsets);

  const { synonymConfigurations } = useAllSynonymConfigurations();

  // Track if synonym generation is enabled
  const [synonymGenerationEnabled, setSynonymGenerationEnabled] =
    useState(true);

  // Track the generated synonym index to know which one to update/remove
  const generatedSynonymIndexRef = useRef<number | null>(null);

  // Track if the user has manually edited the generated synonym
  const synonymManuallyEditedRef = useRef(false);

  // Function to perform substitutions on a term
  const performSubstitutions = useCallback(
    (term: string | undefined): string | null => {
      if (
        !term ||
        !synonymConfigurations ||
        synonymConfigurations.length === 0
      ) {
        return null;
      }

      let result = term;
      let hasChanged = false;

      // Apply all synonym configurations
      for (const config of synonymConfigurations) {
        const regex = new RegExp(config.searchString, 'g');
        const newResult = result.replace(regex, config.replacementString);
        if (newResult !== result) {
          hasChanged = true;
          result = newResult;
        }
      }

      return hasChanged ? result : null;
    },
    [synonymConfigurations],
  );

  // Generate or update synonym based on rules
  const updateGeneratedSynonym = useCallback(() => {
    if (!synonymGenerationEnabled) {
      return;
    }

    // If user has manually edited the generated synonym, don't overwrite it
    if (
      synonymManuallyEditedRef.current &&
      generatedSynonymIndexRef.current !== null
    ) {
      return;
    }

    const fsnFieldName = `nodes[${index}].newConceptDetails.fullySpecifiedName`;
    const ptFieldName = `nodes[${index}].newConceptDetails.preferredTerm`;

    const fsn: string = getValues(
      fsnFieldName as 'nodes.0.newConceptDetails.fullySpecifiedName',
    );
    const pt: string = getValues(
      ptFieldName as 'nodes.0.newConceptDetails.preferredTerm',
    );

    const substitutedFSN = performSubstitutions(fsn);
    const substitutedPT = performSubstitutions(pt);

    let synonymToAdd: string | null = null;

    // Apply the rules from the comment
    if (substitutedFSN && substitutedPT) {
      // Both FSN and PT have substitutions - use PT
      synonymToAdd = substitutedPT;
    } else if (substitutedFSN) {
      // Only FSN has substitution
      synonymToAdd = substitutedFSN;
    } else if (substitutedPT) {
      // Only PT has substitution
      synonymToAdd = substitutedPT;
    }

    // If we have a synonym to add
    if (synonymToAdd) {
      if (generatedSynonymIndexRef.current !== null) {
        // Update existing generated synonym
        const descriptionFieldName = `${fieldName}.${generatedSynonymIndexRef.current}.term`;
        setValue(descriptionFieldName, synonymToAdd);
      } else {
        // Create new generated synonym
        const defaultDescription = createDefaultDescription(
          '1',
          '900000000000013009',
          defaultLangRefset?.en,
        );

        defaultDescription.term = synonymToAdd;
        synonymManuallyEditedRef.current = false;
        append(defaultDescription);
        generatedSynonymIndexRef.current = fields.length;
      }
    } else {
      // No synonym should exist, remove it if it was previously generated
      if (generatedSynonymIndexRef.current !== null) {
        remove(generatedSynonymIndexRef.current);
        generatedSynonymIndexRef.current = null;
      }
    }
  }, [
    performSubstitutions,
    synonymGenerationEnabled,
    fields.length,
    append,
    remove,
    setValue,
    fieldName,
    defaultLangRefset,
    getValues,
    index,
  ]);

  // Watch FSN and PT fields for changes
  const fsnFieldName =
    `nodes[${index}].newConceptDetails.fullySpecifiedName` as const;
  const ptFieldName =
    `nodes[${index}].newConceptDetails.preferredTerm` as const;

  const watchedFSN = useWatch({ control, name: fsnFieldName });
  const watchedPT = useWatch({ control, name: ptFieldName });

  // Run on initial load and when FSN/PT changes
  useEffect(() => {
    updateGeneratedSynonym();
  }, [watchedFSN, watchedPT, synonymConfigurations, updateGeneratedSynonym]);

  // Handle toggling synonym generation
  const handleToggleSynonymGeneration = () => {
    if (synonymGenerationEnabled) {
      // Disabling - remove generated synonym if it exists
      if (generatedSynonymIndexRef.current !== null) {
        remove(generatedSynonymIndexRef.current);
        generatedSynonymIndexRef.current = null;
      }
      setSynonymGenerationEnabled(false);
    } else {
      // Enabling - regenerate synonym
      synonymManuallyEditedRef.current = false;
      setSynonymGenerationEnabled(true);
      // The useEffect will handle regeneration
    }
  };

  // Handle adding a new synonym manually
  const handleAddSynonym = () => {
    const defaultDescription = createDefaultDescription(
      '1',
      '900000000000013009',
      defaultLangRefset?.en,
    );
    append(defaultDescription);
  };

  return (
    <Stack>
      {/* Toggle button for synonym generation */}
      <Stack
        flexDirection={'row'}
        justifyContent={'space-between'}
        alignItems={'center'}
        mb={2}
      >
        <Typography variant="body2">
          Auto-generate synonym from replacements
        </Typography>
        <Button
          size="small"
          variant={synonymGenerationEnabled ? 'contained' : 'outlined'}
          onClick={handleToggleSynonymGeneration}
          data-testid={`${dataTestId}-toggle-generation`}
        >
          {synonymGenerationEnabled ? 'Disable' : 'Enable'}
        </Button>
      </Stack>

      {/* Display existing synonyms with ability to edit */}
      {fields.map((field, index) => {
        const descriptionFieldName = `${fieldName}.${index}.term`;
        const isGeneratedSynonym = index === generatedSynonymIndexRef.current;

        const { onChange: registerOnChange, ...registerRest } = register(
          descriptionFieldName as `nodes.0.newConceptDetails.descriptions`,
        );

        return (
          <InnerBoxSmall component="fieldset" key={field.id}>
            <legend>Synonym {isGeneratedSynonym && '(Auto-generated)'}</legend>
            <Stack flexDirection={'row'} alignItems={'center'}>
              <TextField
                type="text"
                {...registerRest}
                onChange={e => {
                  if (isGeneratedSynonym) {
                    synonymManuallyEditedRef.current = true;
                  }
                  void registerOnChange(e);
                }}
                onBlur={e => {
                  const trimmed = normalizeWhitespace(e.target.value);
                  if (trimmed) {
                    setValue(descriptionFieldName, trimmed);
                  }
                }}
                data-testid={`${dataTestId}-${index}`}
                placeholder="Enter synonym term"
                fullWidth
              />
              <IconButton
                color="error"
                onClick={() => {
                  // If removing the generated synonym, clear the ref
                  if (index === generatedSynonymIndexRef.current) {
                    generatedSynonymIndexRef.current = null;
                    setSynonymGenerationEnabled(false);
                  }
                  remove(index);
                }}
              >
                <DeleteOutlined />
              </IconButton>
            </Stack>
          </InnerBoxSmall>
        );
      })}

      {/* Button to add a new synonym */}
      <Stack flexDirection={'row'} justifyContent={'flex-end'}>
        <Button
          size="medium"
          type="button"
          onClick={handleAddSynonym}
          data-testid={`${dataTestId}-add-button`}
          startIcon={<PlusCircleOutlined />}
        >
          Add Synonym
        </Button>
      </Stack>
    </Stack>
  );
}

interface NewConceptDropdownFieldProps {
  register: UseFormRegister<ProductSummary>;
  originalValue: string;
  fieldName: string;
  legend: string;
  getValues: UseFormGetValues<ProductSummary>;
  dataTestId: string;
  control: Control<ProductSummary>;
  fieldBindings: FieldBindings;
  semanticTag?: string;
  langRefsetCode?: string;
}

function NewConceptDropdownField({
  fieldName,
  legend,
  originalValue,
  getValues,
  dataTestId,
  control,
  fieldBindings,
  semanticTag,
  langRefsetCode,
}: NewConceptDropdownFieldProps) {
  const [fieldChanged, setFieldChange] = useState(false);
  const [ptLengthError, setPtLengthError] = useState('');
  const regExp = convertStringToRegex(
    getValueFromFieldBindings(fieldBindings, 'description.validation.regex'),
  );
  const ptMaxLength = resolvePreferredTermMaxLength(
    fieldBindings,
    langRefsetCode,
  );
  const originalValWithSemanticTag = semanticTag
    ? `${originalValue} (${semanticTag})`
    : originalValue;
  const [copyVal, setCopyVal] = useState(originalValWithSemanticTag);
  const preferredFieldName = fieldName.replace(
    /\.(\w+)$/,
    (match, p1: string) =>
      `.generated${p1.charAt(0).toUpperCase() + p1.slice(1)}`,
  );

  const handleBlur = () => {
    const currentVal: string = getValues(
      fieldName as 'nodes.0.newConceptDetails.preferredTerm',
    );

    setCopyVal(semanticTag ? `${currentVal} (${semanticTag})` : currentVal);

    const generatedVal: string = getValues(
      preferredFieldName as 'nodes.0.newConceptDetails.preferredTerm',
    );
    const generatedValWithoutSemanticTag = removeSemanticTagFromTerm(
      generatedVal,
      semanticTag,
    );
    const hasChanged = !(currentVal === generatedValWithoutSemanticTag);
    setFieldChange(hasChanged);
  };

  const handleCopy = () => {
    if (copyVal) {
      void navigator.clipboard.writeText(copyVal).then(() => {
        enqueueSnackbar(`Copied '${copyVal}' to Clipboard`, {
          variant: 'info',
          autoHideDuration: 3000,
        });
      });
    }
  };
  return (
    <InnerBoxSmall component="fieldset">
      <legend>{legend}</legend>

      <Controller
        name={fieldName as 'nodes.0.newConceptDetails.preferredTerm'}
        control={control}
        defaultValue=""
        rules={
          legend === 'Preferred Term'
            ? {
                validate: value =>
                  !value || (value as string).length <= ptMaxLength
                    ? true
                    : `Preferred term exceeds maximum length of ${ptMaxLength} characters (current: ${(value as string).length}).`,
              }
            : undefined
        }
        render={({ field, fieldState }) => (
          <Stack sx={{ flexDirection: 'column' }}>
            <Stack flexDirection={'row'} alignItems={'center'}>
              <TextField
                {...field}
                error={!!fieldState.error || !!ptLengthError}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                margin="dense"
                fullWidth
                multiline
                minRows={1}
                maxRows={4}
                data-testid={dataTestId}
                onChange={e => {
                  const value =
                    regExp !== null
                      ? replaceAllWithWhiteSpace(
                          regExp,

                          e.target.value,
                        )
                      : e.target.value;

                  field.onChange(value);
                  if (legend === 'Preferred Term') {
                    if (value.length > ptMaxLength) {
                      setPtLengthError(
                        `Preferred term exceeds maximum length of ${ptMaxLength} characters (current: ${value.length}).`,
                      );
                    } else if (ptLengthError) {
                      setPtLengthError('');
                    }
                  }
                }}
                color={fieldChanged ? 'error' : 'primary'}
                onBlur={e => {
                  const trimmed = normalizeWhitespace(e.target.value);
                  field.onChange(trimmed);
                  handleBlur();
                }}
              />
              <IconButton onClick={handleCopy}>
                <ContentCopy />
              </IconButton>
            </Stack>

            {ptLengthError && (
              <FormHelperText error role="alert">
                {ptLengthError}
              </FormHelperText>
            )}
            {semanticTag && (
              <FormHelperText>{`Semantic Tag: (${semanticTag})`}</FormHelperText>
            )}
          </Stack>
        )}
      />
      {fieldChanged && (
        <FormHelperText
          sx={{ color: t => `${t.palette.warning.main}` }}
          role="status"
          aria-live="polite"
        >
          ⚠️ This name has been changed from the auto-generated name.
        </FormHelperText>
      )}
      {!fieldChanged &&
        !!getValues(
          preferredFieldName as 'nodes.0.newConceptDetails.preferredTerm',
        ) && (
          <FormHelperText
            sx={{ color: t => `${t.palette.info.main}` }}
            role="status"
            aria-live="polite"
          >
            🤖 AI-generated suggestion based on editorial rules - please review
          </FormHelperText>
        )}
    </InnerBoxSmall>
  );
}
export default NewConceptDropdown;
