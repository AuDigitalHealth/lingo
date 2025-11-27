import React, { useCallback, useEffect, useRef, useState } from 'react';
import { withTheme } from '@rjsf/core';
import { Theme } from '@rjsf/mui';
import { Alert, Box, Button, Grid, Paper } from '@mui/material';
import WarningModal from '../../../themes/overrides/WarningModal';
import useAuthoringStore from '../../../stores/AuthoringStore';
import { useFetchBulkAuthorBrands } from '../../../hooks/api/tickets/useTicketProduct';
import { findWarningsForBrandPackSizes } from '../../../types/productValidationUtils';
import { Concept } from '../../../types/concept.ts';
import type { ValueSetExpansionContains } from 'fhir/r4';
import { Task } from '../../../types/task.ts';
import { Ticket } from '../../../types/tickets/ticket.ts';
import ProductLoader from '../components/ProductLoader.tsx';
import ProductPreviewManageModal from '../components/ProductPreviewManageModal.tsx';
import AutoCompleteField from './fields/AutoCompleteField.tsx';
import OneOfArrayWidget from './widgets/OneOfArrayWidget.tsx';
import BrandArrayTemplate from './templates/bulkBrandPack/BrandArrayTemplate.tsx';
import { BrandPackSizeCreationDetails } from '../../../types/product.ts';
import TitleWidget from './widgets/TitleWidget.tsx';
import { useQuery } from '@tanstack/react-query';
import MuiGridTemplate from './templates/MuiGridTemplate.tsx';
import AddBrandButton from './fields/bulkBrandPack/AddBrandButton.tsx';
import BrandDetails from './fields/bulkBrandPack/BrandDetails.tsx';
import ExternalIdentifier from './fields/bulkBrandPack/ExternalIdentifiers.tsx';
import { ConfigService } from '../../../api/ConfigService.ts';
import { getMatchingNonDefiningProperties } from './helpers/helpers.ts';
import { flattenAnyOfPreserveOrder } from './helpers/rjsfUtils.ts';
import { validator } from './helpers/validator.ts';
import { buildErrorSchema } from './helpers/validationHelper.ts';

import { ErrorDisplay } from './components/ErrorDisplay.tsx';

interface FormData {
  selectedProduct?: string;
  existingBrands?: any[];
  brands: any[];
  newBrandInput: {
    brand?: any;
    nonDefiningProperties: any[];
  };
}

const Form = withTheme(Theme);

export interface BrandAuthoringV2Props {
  selectedProduct: Concept | ValueSetExpansionContains | null;
  task: Task;
  ticket: Ticket;
  fieldBindings: any;
}

function BrandAuthoring({
  selectedProduct,
  task,
  ticket,
  fieldBindings,
}: BrandAuthoringV2Props) {
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
  const [dynamicSchema, setDynamicSchema] = useState<any>(null);
  const [dynamicUiSchema, setDynamicUiSchema] = useState<any>(null);

  const [runningWarningsCheck, setRunningWarningsCheck] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    brands: [],
    newBrandInput: { brand: undefined, nonDefiningProperties: [] },
  });
  const [errorSchema, setErrorSchema] = useState<any>({});
  const [formErrors, setFormErrors] = useState<any[]>([]);

  const { data, isFetching } = useFetchBulkAuthorBrands(
    selectedProduct,
    task.branchPath,
  );
  const formRef = useRef<any>(null);

  const widgets = {
    OneOfArrayWidget,
    TitleWidget,
  };

  const fields = {
    AutoCompleteField,
    BrandDetails,
    AddBrandButtonField: AddBrandButton,
    ExternalIdentifier,
  };

  const mergeUiOptions = (rootOpts = {}, productOpts = {}) => {
    const merged = {
      ...rootOpts,
      ...productOpts,
    };

    // Utility: order-preserving merge (root → product)
    const mergeArray = (rootArr = [], productArr = []) => {
      const result = [...rootArr];
      for (const item of productArr) {
        if (!result.includes(item)) result.push(item);
      }
      return result;
    };

    merged.mandatorySchemes = mergeArray(
      rootOpts.mandatorySchemes,
      productOpts.mandatorySchemes,
    );

    merged.multiValuedSchemes = mergeArray(
      rootOpts.multiValuedSchemes,
      productOpts.multiValuedSchemes,
    );

    merged.showDefaultOptionSchemes = mergeArray(
      rootOpts.showDefaultOptionSchemes,
      productOpts.showDefaultOptionSchemes,
    );

    merged.readOnlyProperties = mergeArray(
      rootOpts.readOnlyProperties,
      productOpts.readOnlyProperties,
    );

    merged.propertyOrder = mergeArray(
      rootOpts.propertyOrder,
      productOpts.propertyOrder,
    );

    // binding → shallow merge, product overrides root, no deep merge
    merged.binding = {
      ...(rootOpts.binding || {}),
      ...(productOpts.binding || {}),
    };

    return merged;
  };

  const rjsfValidationWrapper = {
    ...validator,
    validateFormData: (formData: any, schema: any, customUiSchema?: any) => {
      const result = validator.validateFormData(
        formData,
        dynamicSchema,
        dynamicUiSchema,
      );

      return result.length > 0
        ? result.map((err: any) => ({
            property: err.dataPath || err.instancePath || '', // map path
            message: err.message,
          }))
        : [];
    },
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
        BrandDetails: {
          ...schema.$defs?.BrandDetails,
          properties: {
            ...schema.$defs?.BrandDetails?.properties,
            nonDefiningProperties: {
              type: 'array',
              title: 'Non Defining Properties',
              items: { $ref: '#/$defs/Combined_NonDefiningProperty' },
            },
          },
        },
      },
    };
    setDynamicSchema(updatedSchema);
  }, [schema, uiSchema]);

  useEffect(() => {
    if (!uiSchema) return;

    const rootUiOptions = uiSchema?.nonDefiningProperties?.['ui:options'];

    const productUiOptions =
      uiSchema?.containedPackages?.items?.packageDetails?.containedProducts
        ?.items?.productDetails?.nonDefiningProperties?.['ui:options']; //merging product nondefining props

    const mergedUiOptions = mergeUiOptions(rootUiOptions, productUiOptions);

    if (!mergedUiOptions) return;

    const newUiSchema = { ...uiSchema };

    // Apply merged ui:options back into both levels
    if (!newUiSchema.nonDefiningProperties) {
      newUiSchema.nonDefiningProperties = {};
    }
    newUiSchema.nonDefiningProperties['ui:options'] = mergedUiOptions;
    newUiSchema.brands.items.brandDetails.nonDefiningProperties['ui:options'] =
      mergedUiOptions;

    const productPath =
      newUiSchema?.containedPackages?.items?.packageDetails?.containedProducts
        ?.items?.productDetails;

    if (productPath) {
      if (!productPath.nonDefiningProperties) {
        productPath.nonDefiningProperties = {};
      }
      productPath.nonDefiningProperties['ui:options'] = mergedUiOptions;
    }

    setDynamicUiSchema(newUiSchema);
  }, [uiSchema]);

  const handleClear = useCallback(() => {
    const newData: FormData = {
      ...formData,
      newBrandInput: { brand: undefined, nonDefiningProperties: [] },
    };
    setFormData(newData);
    setFormErrors([]);
    if (formRef.current) {
      formRef.current.reset();
    }
  }, [formData]);

  useEffect(() => {
    if (selectedProduct && data) {
      setFormData({
        brands: [],
        newBrandInput: { brand: undefined, nonDefiningProperties: [] },
      });
      setFormErrors([]);
      const matchingProperties = data.brands
        ? getMatchingNonDefiningProperties(data.brands)
        : [];
      const newData: FormData = {
        selectedProduct: selectedProduct.pt?.term || '',
        existingBrands: data.brands || [],
        brands: [],
        newBrandInput: {
          brand: undefined,
          nonDefiningProperties: matchingProperties,
        },
      };
      setFormData(newData);
    } else {
      setFormData({
        brands: [],
        newBrandInput: { brand: undefined, nonDefiningProperties: [] },
      });
      setFormErrors([]);
    }
  }, [selectedProduct, data]);

  const onSubmit = async (submittedFormData: FormData) => {
    setFormData(submittedFormData);
    setBrandPackSizePreviewDetails(undefined);
    const brandPackSizeDetails: BrandPackSizeCreationDetails = {
      type: 'brand-pack-size',
      productId: selectedProduct?.id,
      brands: {
        productId: selectedProduct?.id,
        brands: submittedFormData.brands,
      },
      nonDefiningProperties: [],
    };
    setBrandPackSizePreviewDetails(brandPackSizeDetails);
    setRunningWarningsCheck(true);

    try {
      const warnings = await findWarningsForBrandPackSizes(
        brandPackSizeDetails,
        task.branchPath,
        fieldBindings,
      );
      if (warnings.length > 0) {
        setWarnings(warnings);
        setPreviewModalOpen(false);
        setWarningModalOpen(true);
      } else {
        previewBrandPackSize(
          brandPackSizeDetails,
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
  const onError = (errors: any) => {
    if (errors && errors.length > 0) {
      const missingSchemes: string[] = errors[0]?.data?.missingSchemes ?? [];
      const readOnlyProps: string[] =
        dynamicUiSchema.nonDefiningProperties?.['ui:options']
          ?.readOnlyProperties ?? [];

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
    schema: dynamicSchema,

    errorSchema,
    onFormDataChange: (newFormData: FormData) => {
      setFormData(newFormData);
    },
    handleClear,
    onError,
    validator,
    formErrors,
    setFormErrors,
  };

  if (isSchemaLoading || isUiSchemaLoading) {
    return <ProductLoader message="Loading Schema" />;
  }
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
        Search and select a product to create new brand(s). Results are limited
        to single-component products, as only these are eligible.
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
                Enter one or more new brands for the selected product.
              </Alert>
              <ErrorDisplay errors={formErrors} />
              <Form
                ref={formRef}
                schema={dynamicSchema}
                uiSchema={!dynamicUiSchema ? uiSchema : dynamicUiSchema}
                formData={formData}
                onChange={({ formData: newFormData }) =>
                  setFormData(newFormData as FormData)
                }
                onError={onError}
                onSubmit={({ formData }) => onSubmit(formData)}
                widgets={widgets}
                fields={fields}
                templates={{
                  ArrayFieldTemplate: BrandArrayTemplate,
                  ObjectFieldTemplate: MuiGridTemplate,
                }}
                validator={rjsfValidationWrapper}
                formContext={formContext}
                showErrorList={false}
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
                    disabled={!formData.brands || formData.brands.length === 0}
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
    queryKey: ['bulk-brand-schema', branchPath],
    queryFn: () => ConfigService.fetchBulkBrandSchemaData(branchPath),
    enabled: !!branchPath,
  });
};

export const useUiSchemaQuery = (branchPath: string) => {
  return useQuery({
    queryKey: ['bulk-brand-uiSchema', branchPath],
    queryFn: () => ConfigService.fetchBulkBrandUiSchemaData(branchPath),
    enabled: !!branchPath,
  });
};

export default BrandAuthoring;
