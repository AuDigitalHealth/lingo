import React, { useCallback, useEffect, useRef, useState } from 'react';
import { withTheme } from '@rjsf/core';
import { Theme } from '@rjsf/mui';
import { Alert, Box, Button, Grid, Paper } from '@mui/material';
import WarningModal from '../../../themes/overrides/WarningModal';
import useAuthoringStore from '../../../stores/AuthoringStore';
import { useFetchBulkAuthorPackSizes } from '../../../hooks/api/tickets/useTicketProduct';
import { findWarningsForBrandPackSizes } from '../../../types/productValidationUtils';
import { Concept } from '../../../types/concept.ts';
import type { ValueSetExpansionContains } from 'fhir/r4';
import { Task } from '../../../types/task.ts';
import { Ticket } from '../../../types/tickets/ticket.ts';
import ProductLoader from '../components/ProductLoader.tsx';
import ProductPreviewManageModal from '../components/ProductPreviewManageModal.tsx';
import OneOfArrayWidget from './widgets/OneOfArrayWidget.tsx';
import PackSizeArrayTemplate from './templates/bulkBrandPack/PackSizeArrayTemplate.tsx';
import { BrandPackSizeCreationDetails } from '../../../types/product.ts';
import TitleWidget from './widgets/TitleWidget.tsx';
import AutoCompleteField from './fields/AutoCompleteField.tsx';
import { useQuery } from '@tanstack/react-query';
import MuiGridTemplate from './templates/MuiGridTemplate.tsx';
import AddPackSizeButton from './fields/bulkBrandPack/AddPackSizeButton.tsx';
import ExternalIdentifiers from './fields/bulkBrandPack/ExternalIdentifiers.tsx';
import PackDetails from './fields/bulkBrandPack/PackDetails.tsx';
import { ConfigService } from '../../../api/ConfigService.ts';
import { getDefaultNonDefiningProperties } from './helpers/helpers.ts';
import { validator } from './helpers/validator.ts';
import { ErrorDisplay } from './components/ErrorDisplay.tsx';
import { buildErrorSchema } from './helpers/validationHelper.ts';
import { flattenAnyOfPreserveOrder } from './helpers/rjsfUtils.ts';

interface FormData {
  selectedProduct?: string;
  existingPackSizes?: any[];
  packSizes: any[];
  newPackSizeInput: {
    packSize?: number;
    nonDefiningProperties: any[];
  };
  unitOfMeasure?: any;
}

const Form = withTheme(Theme);

export interface PackSizeAuthoringV2Props {
  selectedProduct: Concept | ValueSetExpansionContains | null;
  task: Task;
  ticket: Ticket;
  fieldBindings: any;
}

function PackSizeAuthoring({
  selectedProduct,
  task,
  ticket,
  fieldBindings,
}: PackSizeAuthoringV2Props) {
  const {
    productSaveDetails,
    previewModalOpen,
    setPreviewModalOpen,
    loadingPreview,
    warningModalOpen,
    setWarningModalOpen,
    previewBrandPackSize,
    handlePreviewToggleModal,
    setBrandPackSizePreviewDetails,
  } = useAuthoringStore();

  const { data: schema, isLoading: isSchemaLoading } = useSchemaQuery(
    task.branchPath,
  );
  const { data: uiSchema, isLoading: isUiSchemaLoading } = useUiSchemaQuery(
    task.branchPath,
  );

  const [runningWarningsCheck, setRunningWarningsCheck] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    packSizes: [],
    newPackSizeInput: { packSize: undefined, nonDefiningProperties: [] },
  });

  const { data, isFetching } = useFetchBulkAuthorPackSizes(
    selectedProduct,
    task.branchPath,
  );
  const [errorSchema, setErrorSchema] = useState<any>({});
  const [formErrors, setFormErrors] = useState<any[]>([]);
  const formRef = useRef<any>(null);
  const [dynamicUiSchema, setDynamicUiSchema] = useState<any>(null);
  const [validationSchema, setValidationSchema] = useState<any>(null);

  const widgets = {
    OneOfArrayWidget,
    TitleWidget,
  };

  const fields = {
    AddButtonField: AddPackSizeButton,
    AutoCompleteField,
    PackDetails,
    ExternalIdentifiers,
  };

  const handleClear = useCallback(() => {
    const newData: FormData = {
      ...formData,
      newPackSizeInput: { packSize: undefined, nonDefiningProperties: [] },
    };
    setFormData(newData);
    setFormErrors([]);
    if (formRef.current) {
      formRef.current.reset();
    }
  }, [formData]);

  useEffect(() => {
    if (selectedProduct && data) {
      const showDefaultValues =
        dynamicUiSchema.newPackSizeInput['ui:options']?.showDefaultValues;

      const readOnlyProperties =
        dynamicUiSchema.packSizes.items.packDetails.nonDefiningProperties[
          'ui:options'
        ]?.readOnlyProperties;

      const defaultProperties = data.packSizes
        ? getDefaultNonDefiningProperties(
            data.packSizes,
            showDefaultValues,
            readOnlyProperties,
          )
        : [];
      setFormErrors([]);
      const newData: FormData = {
        selectedProduct: selectedProduct.pt?.term || '',
        existingPackSizes: data.packSizes || [],
        unitOfMeasure: data.unitOfMeasure,
        packSizes: [],
        newPackSizeInput: {
          packSize: undefined,
          nonDefiningProperties: defaultProperties,
        },
      };
      setFormData(newData);
    } else {
      setFormData({
        packSizes: [],
        newPackSizeInput: { packSize: undefined, nonDefiningProperties: [] },
      });
    }
  }, [selectedProduct, data]);

  const onSubmit = async (submittedFormData: FormData) => {
    setFormData(submittedFormData);
    setBrandPackSizePreviewDetails(undefined);
    const packSizeDetails: BrandPackSizeCreationDetails = {
      type: 'brand-pack-size',
      productId: selectedProduct?.id,
      packSizes: {
        productId: selectedProduct?.id,
        unitOfMeasure: data?.unitOfMeasure,
        packSizes: submittedFormData.packSizes,
      },
      nonDefiningProperties: [],
    };
    setBrandPackSizePreviewDetails(packSizeDetails);
    setRunningWarningsCheck(true);

    try {
      const warnings = await findWarningsForBrandPackSizes(
        packSizeDetails,
        task.branchPath,
        fieldBindings,
      );
      if (warnings.length > 0) {
        setWarnings(warnings);
        setPreviewModalOpen(false);
        setWarningModalOpen(true);
      } else {
        previewBrandPackSize(
          packSizeDetails,
          ticket,
          task.branchPath,
          null,
          ticket.id,
        );
        setPreviewModalOpen(true);
      }
    } catch (error) {
      console.error('Error during submission:', error);
      setWarnings(['An error occurred while processing your request.']);
      setWarningModalOpen(true);
    } finally {
      setRunningWarningsCheck(false);
    }
  };

  const handlePreviewClick = () => {
    if (formRef.current && formData) {
      onSubmit(formData);
    }
  };

  useEffect(() => {
    if (!schema) return;

    // --- Build dynamic Combined_NonDefiningProperty ---
    const combinedNonDefiningProperty = {
      type: 'object',
      anyOf: [
        ...flattenAnyOfPreserveOrder(
          schema.$defs?.MEDICATION_PRODUCT_NonDefiningProperty,
        ),
        ...flattenAnyOfPreserveOrder(
          schema.$defs?.MEDICATION_PACKAGE_NonDefiningProperty,
        ),
      ],
    };

    const updatedSchema = {
      ...schema,
      $defs: {
        ...schema.$defs,
        Combined_NonDefiningProperty: combinedNonDefiningProperty,
        PackDetails: {
          ...schema.$defs?.PackDetails,
          properties: {
            ...schema.$defs?.PackDetails?.properties,
            nonDefiningProperties: {
              type: 'array',
              title: 'Non Defining Properties',
              items: { $ref: '#/$defs/Combined_NonDefiningProperty' },
            },
          },
        },
      },
    };
    setValidationSchema(updatedSchema);
  }, [schema, uiSchema]);

  useEffect(() => {
    if (!uiSchema) return;
    const rootUiOptions = uiSchema?.nonDefiningProperties?.['ui:options'];
    const newUiSchema = { ...uiSchema };

    newUiSchema.packSizes.items.packDetails.nonDefiningProperties[
      'ui:options'
    ] = rootUiOptions;

    setDynamicUiSchema(newUiSchema);
  }, [uiSchema]);

  const onError = (errors: any) => {
    if (errors && errors.length > 0) {
      const missingSchemes: string[] = errors[0]?.data?.missingSchemes ?? [];
      const readOnlyProps: string[] =
        uiSchema?.nonDefiningProperties?.['ui:options']?.readOnlyProperties ??
        [];

      const hasReadOnlyMissingScheme = missingSchemes.some(scheme =>
        readOnlyProps.includes(scheme),
      );

      const uiErrors = [...errors];

      if (hasReadOnlyMissingScheme) {
        uiErrors.push({
          message:
            'Some mandatory fields cannot be updated here because they are read-only. Please switch to the normal edit screen to make changes.',
          stack:
            'Some mandatory fields cannot be updated here because they are read-only. Please switch to the normal edit screen to make changes.',
        });
      }

      const newErrorSchema = buildErrorSchema(uiErrors);
      setErrorSchema(newErrorSchema);
      setFormErrors(uiErrors);
    } else {
      setFormErrors([]);
    }
  };

  const formContext = {
    formData,
    uiSchema: dynamicUiSchema,
    schema,
    validationSchema,
    errorSchema,
    onError,
    formErrors,
    setFormErrors,
    onFormDataChange: (newFormData: FormData) => {
      setFormData(newFormData);
    },
    unitOfMeasure: data?.unitOfMeasure,
    handleClear,
    validator,
  };

  if (isFetching)
    return (
      <ProductLoader
        message={`Loading Product details for ${selectedProduct?.pt?.term}`}
      />
    );
  if (loadingPreview)
    return (
      <ProductLoader
        message={`Loading Product Preview for ${selectedProduct?.pt?.term}`}
      />
    );
  if (runningWarningsCheck)
    return <ProductLoader message={`Running validation before Preview`} />;

  if (!selectedProduct || !data) {
    return (
      <Alert severity="info">
        Search and select a product to create new pack size(s). Results are
        limited to single-component products, as only these are eligible.
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container>
        <WarningModal
          open={warningModalOpen}
          content={warnings.join('\n')}
          handleClose={() => setWarningModalOpen(false)}
          action="Proceed"
          handleAction={() =>
            previewBrandPackSize(
              formData as any,
              ticket,
              task.branchPath,
              null,
              ticket.id,
            )
          }
        />
        <ProductPreviewManageModal
          productType="medication"
          productCreationDetails={productSaveDetails}
          handleClose={handlePreviewToggleModal}
          open={previewModalOpen}
          branch={task.branchPath}
          ticket={ticket}
        />
        <Grid item xs={12}>
          <Paper>
            <Box m={1} p={1}>
              <Alert severity="info" sx={{ mb: 1 }}>
                Enter one or more new pack sizes for the selected product.
              </Alert>
              <ErrorDisplay errors={formErrors} />
              <Form
                ref={formRef}
                schema={schema}
                uiSchema={uiSchema}
                formData={formData}
                onChange={({ formData: newFormData }) =>
                  setFormData(newFormData as FormData)
                }
                onSubmit={({ formData }) => onSubmit(formData)}
                widgets={widgets}
                fields={fields}
                templates={{
                  ArrayFieldTemplate: PackSizeArrayTemplate,
                  ObjectFieldTemplate: MuiGridTemplate,
                }}
                validator={validator}
                formContext={formContext}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 1,
                    mt: 1,
                  }}
                >
                  <Button
                    onClick={handlePreviewClick}
                    variant="contained"
                    color="primary"
                    size="small"
                    disabled={
                      !formData.packSizes || formData.packSizes.length === 0
                    }
                  >
                    Preview
                  </Button>
                </Box>
              </Form>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export const useSchemaQuery = (branchPath: string) => {
  return useQuery({
    queryKey: ['bulk-pack-schema', branchPath],
    queryFn: () => ConfigService.fetchBulkPackSchemaData(branchPath),
    enabled: !!branchPath,
  });
};

export const useUiSchemaQuery = (branchPath: string) => {
  return useQuery({
    queryKey: ['bulk-pack-uiSchema', branchPath],
    queryFn: () => ConfigService.fetchBulkPackUiSchemaData(branchPath),
    enabled: !!branchPath,
  });
};

export default PackSizeAuthoring;
