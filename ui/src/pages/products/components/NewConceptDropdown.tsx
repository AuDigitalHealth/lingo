import { Product, ProductSummary } from '../../../types/concept.ts';
import {
  Control,
  Controller,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
  useFieldArray,
} from 'react-hook-form';
import {
  FormControlLabel,
  FormHelperText,
  Grid,
  Stack,
  Switch,
  TextField,
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
import { getValueFromFieldBindings } from '../../../utils/helpers/FieldBindingUtils.ts';
import React, { useRef, useState } from 'react';
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
        />
        <AdditionalSynonymField
          fieldName={`nodes[${index}].newConceptDetails.descriptions`}
          register={register}
          dataTestId={`pt-input`}
          control={control}
          setValue={setValue}
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
}

function AdditionalSynonymField({
  register,
  fieldName,
  dataTestId,
  control,
  setValue,
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

  // Handle adding a new synonym
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
      {/* <fieldset>
        <legend>{legend}</legend> */}

      {/* Display existing synonyms with ability to edit */}
      {fields.map((field, index) => {
        // For each description in the array, create an input field
        const descriptionFieldName = `${fieldName}.${index}.term`;

        return (
          <InnerBoxSmall component="fieldset">
            <legend>Synonym</legend>
            <Stack flexDirection={'row'} alignItems={'center'}>
              <TextField
                type="text"
                {...register(
                  descriptionFieldName as `nodes.0.newConceptDetails.descriptions`,
                )}
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
              <IconButton color="error" onClick={() => remove(index)}>
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
      {/* </fieldset> */}
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
}: NewConceptDropdownFieldProps) {
  const [fieldChanged, setFieldChange] = useState(false);
  const regExp = convertStringToRegex(
    getValueFromFieldBindings(fieldBindings, 'description.validation.regex'),
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

    setCopyVal(`${currentVal} ${semanticTag}`);

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
        render={({ field }) => (
          <Stack sx={{ flexDirection: 'column' }}>
            <Stack flexDirection={'row'} alignItems={'center'}>
              <TextField
                {...field}
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
