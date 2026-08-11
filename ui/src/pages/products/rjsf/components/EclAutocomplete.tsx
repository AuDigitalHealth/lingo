import React, { useEffect, useRef, useState } from 'react';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import {
  Concept,
  ConceptMini,
  ConceptSearchResult,
} from '../../../../types/concept.ts';
import { useSearchConceptsByEcl } from '../../../../hooks/api/useInitializeConcepts.tsx';
import { FieldProps } from '@rjsf/utils';
import useApplicationConfigStore from '../../../../stores/ApplicationConfigStore.ts';
import useAuthoringStore from '../../../../stores/AuthoringStore.ts';

const EclAutocomplete: React.FC<FieldProps<any, any>> = props => {
  const {
    id,
    ecl,
    branch,
    value,
    isDisabled,
    errorMessage,
    sx,
    onChange,
    schema,
    showDefaultOptions,
    uiSchema,
    required,
    turnOffPublishParam,
    info,
    readOnly,
  } = props;

  const apLanguageHeader =
    useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader;
  const missingConceptIds = useAuthoringStore(state => state.missingConceptIds);
  const [inputValue, setInputValue] = useState<Concept>(
    value || createEmptyConcept(apLanguageHeader),
  );
  const [options, setOptions] = useState<ConceptSearchResult[]>(
    value ? [value as ConceptSearchResult] : [],
  );

  const disabled = isDisabled || props.disabled || false;

  // Clear state when disabled. Only wipe the field's value on a genuine transition
  // from enabled to disabled (e.g. the parent concept is deselected). The dependant
  // `disabled` flag is propagated asynchronously, so while an existing product is being
  // loaded the field can momentarily hold its loaded value while still flagged disabled;
  // clearing unconditionally there would wipe the freshly loaded value (e.g.
  // specificDeviceType not populating on load).
  const wasDisabledRef = useRef(disabled);
  useEffect(() => {
    const transitionedToDisabled = disabled && !wasDisabledRef.current;
    wasDisabledRef.current = disabled;
    if (disabled) {
      setInputValue(createEmptyConcept(apLanguageHeader));
      setOptions([]);
      if (value && transitionedToDisabled) {
        onChange(null);
      }
    }
  }, [disabled, onChange, value]);

  const { isLoading, allData } = useSearchConceptsByEcl(
    inputValue?.pt?.term,
    ecl && ecl.length > 0 && !disabled ? ecl : undefined,
    branch,
    (showDefaultOptions as boolean) && !disabled,
    undefined,
    turnOffPublishParam,
  );

  const title = props?.title || schema?.title || uiSchema?.['ui:title'] || '';
  const label = required ? `${title} *` : title;

  useEffect(() => {
    if (disabled) return;
    let uniqueOptions: Concept[] = [];
    if (allData) {
      let processedData = allData;

      // Only classify types when turnOffPublishParam is true
      if (turnOffPublishParam) {
        processedData = [
          ...allData
            .filter(item => !item.effectiveTime) // no effectiveTime = unpublished
            .map(item => ({ ...item, type: 'Unpublished Concepts' })),
          ...allData
            .filter(item => item.effectiveTime) // has effectiveTime = published
            .map(item => ({ ...item, type: 'Published Concepts' })),
        ];
      }
      uniqueOptions = Array.from(
        new Map(processedData.map(item => [item.conceptId, item])).values(),
      );
    }
    // Always retain the currently selected concept as an option, so MUI can render the
    // selection even when the typeahead query (term/ECL filtered) didn't return it.
    //
    // Note this makes `options` useless as evidence that the value exists on the branch —
    // a loaded value carries pt/fsn from the saved product JSON, which was resolved
    // against whichever branch it was authored on, not necessarily this one. Whether the
    // concept is actually present is decided by the batched pre-save check and read back
    // from the authoring store below.
    if (
      value?.conceptId &&
      !uniqueOptions.some(option => option.conceptId === value.conceptId)
    ) {
      uniqueOptions = [value as ConceptSearchResult, ...uniqueOptions];
    }
    setOptions(uniqueOptions);
  }, [allData, disabled, value]);

  useEffect(() => {
    if (disabled || !value) return;
    const newTerm = value?.pt?.term || '';
    setInputValue(prev => (prev?.pt?.term !== newTerm ? value : prev));
  }, [value?.conceptId, disabled]);

  const handleProductChange = (selectedProduct: Concept | null) => {
    if (disabled) return;
    if (selectedProduct) {
      const conceptMini: ConceptMini = {
        conceptId: selectedProduct.conceptId || undefined,
        pt: selectedProduct.pt,
        fsn: selectedProduct.fsn,
        definitionStatus: selectedProduct.definitionStatus,
        moduleId: selectedProduct.moduleId,
      };
      onChange(conceptMini);
      setInputValue(selectedProduct);
    } else {
      onChange(null);
      setInputValue(createEmptyConcept(apLanguageHeader));
    }
  };

  const handleBlur = () => {
    if (disabled) return;
    if (inputValue?.pt?.term && !value?.conceptId) {
      const matchingOption = options.find(
        option =>
          option.pt?.term?.toLowerCase() === inputValue?.pt?.term.toLowerCase(),
      );

      if (matchingOption) {
        handleProductChange(matchingOption);
      } else {
        handleProductChange(inputValue);
      }
    }
  };

  const normalizedValue =
    options.find(option => option.conceptId === value?.conceptId) || value;
  // Free text the user typed that never resolved to a concept — handleBlur commits it as a
  // term with no conceptId rather than discarding what was typed.
  const needsAttention = Boolean(value && value.pt?.term && !value.conceptId);

  // Driven by the batched existence check rather than by `options` — see the note in the
  // options effect above. Previously this was computed from `options`, which the same
  // effect had just inserted `value` into, so it could never fire for a loaded value.
  const needsAttentionBecauseConceptMightNotExist = Boolean(
    value?.conceptId && missingConceptIds.includes(value.conceptId),
  );

  const needsAttentionBecauseConceptMightNotExistMessage =
    'Concept does not exist in this branch, please search or create the concept';

  const needsAttentionMessage =
    needsAttention && !errorMessage
      ? 'Please search for and select a valid option'
      : needsAttentionBecauseConceptMightNotExist
        ? needsAttentionBecauseConceptMightNotExistMessage
        : undefined;

  return (
    <span data-component-name="EclAutocomplete" style={{ width: 'inherit' }}>
      <Autocomplete
        loading={isLoading}
        disabled={disabled || readOnly}
        options={disabled ? [] : options}
        getOptionLabel={(option: ConceptSearchResult) => option?.pt?.term || ''}
        value={normalizedValue}
        onInputChange={
          readOnly
            ? undefined
            : (event, newValue) =>
                setInputValue(createEmptyConcept(apLanguageHeader, newValue))
        }
        groupBy={option => option.type}
        onChange={
          readOnly
            ? undefined
            : (event, selectedValue) =>
                handleProductChange(selectedValue as Concept)
        }
        isOptionEqualToValue={(option, selectedValue) =>
          option?.conceptId === selectedValue?.conceptId
        }
        renderOption={(props, option) => (
          <li {...props} key={option.conceptId}>
            {option.pt.term}
          </li>
        )}
        filterOptions={x => x}
        renderInput={params => (
          <TextField
            {...params}
            data-testid={id}
            label={label}
            error={Boolean(
              errorMessage ||
              needsAttention ||
              needsAttentionBecauseConceptMightNotExist,
            )}
            onBlur={readOnly ? undefined : handleBlur}
            helperText={
              errorMessage
                ? errorMessage
                : needsAttentionMessage
                  ? needsAttentionMessage
                  : info
            }
            InputProps={{
              ...params.InputProps,
              readOnly: readOnly,
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            disabled={disabled}
            sx={{
              '& .MuiFormHelperText-root': {
                m: 0,
                minHeight: '1em',
                color:
                  errorMessage ||
                  needsAttention ||
                  needsAttentionBecauseConceptMightNotExist
                    ? 'error.main'
                    : 'text.secondary',
              },
            }}
          />
        )}
        sx={sx || { width: '100%' }}
      />
    </span>
  );
};

function createEmptyConcept(
  preferredLanguageCode: string,
  term?: string,
): Concept {
  return {
    conceptId: undefined,
    active: undefined,
    definitionStatus: null,
    moduleId: null,
    effectiveTime: null,
    pt: {
      lang: preferredLanguageCode,
      term: term || '',
      semanticTag: undefined,
    },
    fsn: {
      lang: preferredLanguageCode,
      term: term || '',
      semanticTag: undefined,
    },
    descendantCount: null,
    isLeafInferred: null,
    relationships: [],
    classAxioms: [],
    gciAxioms: [],
    id: null,
    idAndFsnTerm: null,
  };
}

export default EclAutocomplete;
