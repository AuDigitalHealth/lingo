import React, { useCallback, useEffect, useRef, useState } from 'react';
import { withTheme } from '@rjsf/core';
import { Theme } from '@rjsf/mui';
import { Box, Button, Grid, Paper, Alert } from '@mui/material';
import WarningModal from '../../../themes/overrides/WarningModal';
import useAuthoringStore from '../../../stores/AuthoringStore';
import { useFetchBulkAuthorPackSizes } from '../../../hooks/api/tickets/useTicketProduct';
import { findWarningsForBrandPackSizes } from '../../../types/productValidationUtils';
import { Concept } from '../../../types/concept.ts';
import type { ValueSetExpansionContains } from 'fhir/r4';
import { Task } from '../../../types/task.ts';
import { Ticket } from '../../../types/tickets/ticket.ts';
import ProductLoader from '../components/ProductLoader.tsx';
import ProductPreviewCreateModal from '../components/ProductPreviewCreateModal.tsx';
import { customizeValidator } from '@rjsf/validator-ajv8';
import ajvErrors from 'ajv-errors';
import OneOfArrayWidget from './widgets/OneOfArrayWidget.tsx';

import PackSizeArrayTemplate from './templates/bulkBrandPack/PackSizeArrayTemplate.tsx'; // You'll need to create this if you want custom array rendering
import { BrandPackSizeCreationDetails } from '../../../types/product.ts';
import TitleWidget from './widgets/TitleWidget.tsx';
import AutoCompleteField from './fields/AutoCompleteField.tsx';
import { useQuery } from '@tanstack/react-query';
import MuiGridTemplate from './templates/MuiGridTemplate.tsx';
import AddButtonField from './fields/AddButtonField.tsx';
import ExternalIdentifiers from './fields/bulkBrandPack/ExternalIdentifiers.tsx';
import PackDetails from './fields/bulkBrandPack/PackDetails.tsx';

interface FormData {
  selectedProduct?: string;
  existingPackSizes?: any[];
  packSizes: any[];
  newPackSizeInput: {
    packSize?: number;
    externalIdentifiers: any[];
  };
}

const Form = withTheme(Theme);

export interface PackSizeAuthoringV2Props {
  selectedProduct: Concept | ValueSetExpansionContains | null;
  task: Task;
  ticket: Ticket;
  fieldBindings: any;
}

const validator = customizeValidator();
ajvErrors(validator.ajv);

function PackSizeAuthoring({
  selectedProduct,
  task,
  ticket,
  fieldBindings,
}: PackSizeAuthoringV2Props) {
  const {
    productCreationDetails,
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
  const [formData, setFormData] = useState<FormData>({});
  const { data, isFetching } = useFetchBulkAuthorPackSizes(
    selectedProduct,
    task.branchPath,
  );
  const formRef = useRef<any>(null);

  const widgets = {
    OneOfArrayWidget,
    TitleWidget,
  };

  const fields = {
    AddButtonField,
    AutoCompleteField,
    PackDetails,
    ExternalIdentifiers,
  };

  const handleClear = useCallback(() => {
    const newData: FormData = {
      ...formData,
      newPackSizeInput: { packSize: undefined, externalIdentifiers: [] },
    };
    setFormData(newData);
    if (formRef.current) {
      formRef.current.reset();
    }
  }, [formData]);

  useEffect(() => {
    if (selectedProduct && data) {
      const newData: FormData = {
        selectedProduct: selectedProduct.pt?.term || '',
        existingPackSizes: data.packSizes || [],
        unitOfMeasure: data.unitOfMeasure,
        newPackSizeInput: { packSize: undefined, externalIdentifiers: [] },
      };
      console.log('Initial formData:', newData);
      setFormData(newData);
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
        unitOfMeasure: data?.unitOfMeasure, // Assuming this comes from the fetched data
        packSizes: submittedFormData.packSizes,
      },
      externalIdentifiers: [],
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
  const formContext = {
    onChange: (newFormData: FormData) => {
      setFormData(newFormData);
    },
    formData,
    handleClear,
    onSubmit: (data: { formData: FormData }) => onSubmit(data.formData),
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

  // TODO: Re-enable
  if (!selectedProduct || !data) {
    return (
      <Alert severity="info">
        Search and select a product to create new pack size(s).
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
        <ProductPreviewCreateModal
          productType="medication"
          productCreationDetails={productCreationDetails}
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
                  ArrayFieldTemplate: PackSizeArrayTemplate, // Create this if needed
                  ObjectFieldTemplate: MuiGridTemplate,
                }}
                validator={validator}
                formContext={{
                  formData,
                  onFormDataChange: setFormData,
                }}
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
                      !formContext.formData.packSizes ||
                      formContext.formData.packSizes.length === 0
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
  // return useQuery({
  //   queryKey: ['bulk-pack-schema', branchPath],
  //   // queryFn: () => ConfigService.fetchBulkPackSchemaData(branchPath),
  //   queryFn: () => async () => {
  return {
    isLoading: false,
    data: {
      type: 'object',
      $defs: {
        SnowstormConceptMini: {
          type: 'object',
          properties: {
            conceptId: {
              type: 'string',
            },
            pt: {
              $ref: '#/$defs/SnowstormTermLangPojo',
            },
          },
          minProperties: 1,
          errorMessage: {
            minProperties: 'Field must be populated.',
          },
        },
        SnowstormTermLangPojo: {
          type: 'object',
          additionalProperties: false,
          properties: {
            lang: {
              type: 'string',
            },
            term: {
              type: 'string',
            },
          },
        },
        ExternalIdentifier: {
          type: 'object',
          anyOf: [
            {
              title: 'ARTGID',
              type: 'object',
              properties: {
                identifierScheme: {
                  type: 'string',
                  const: 'artgid',
                },
                relationshipType: {
                  title: 'Relationship type',
                  type: 'string',
                  const: 'RELATED',
                },
                identifierValue: {
                  title: 'ARTGID',
                  type: 'string',
                  pattern: '\\d{1,8}',
                  errorMessage: {
                    pattern: 'Please enter a valid ARTGID matching \\d{1,8}',
                  },
                },
              },
            },
            {
              title: 'GTIN',
              type: 'object',
              properties: {
                identifierScheme: {
                  type: 'string',
                  const: 'gtin',
                },
                relationshipType: {
                  title: 'Relationship type',
                  type: 'string',
                  const: 'RELATED',
                },
                identifierValue: {
                  title: 'GTIN',
                  type: 'string',
                  pattern: '\\d{1,8}',
                  errorMessage: {
                    pattern: 'Please enter a valid GTIN matching \\d{1,8}',
                  },
                },
              },
            },
            {
              title: 'ATC level 5 code',
              type: 'object',
              properties: {
                identifierScheme: {
                  type: 'string',
                  const: 'atc',
                },
                relationshipType: {
                  title: 'Relationship type',
                  type: 'string',
                  const: 'RELATED',
                },
                identifierValue: {
                  title: 'ATC level 5 code',
                  type: 'string',
                  pattern: '^.+$',
                  errorMessage: {
                    pattern:
                      'Please enter a valid ATC level 5 code matching ^.+$',
                  },
                },
              },
            },
            {
              title: 'GMS Reimbursable Number',
              type: 'object',
              properties: {
                identifierScheme: {
                  type: 'string',
                  const: 'pcrs',
                },
                relationshipType: {
                  title: 'Relationship type',
                  type: 'string',
                  const: 'RELATED',
                },
                identifierValue: {
                  title: 'GMS Reimbursable Number',
                  type: 'string',
                  pattern: '^.+$',
                  errorMessage: {
                    pattern:
                      'Please enter a valid GMS Reimbursable Number matching ^.+$',
                  },
                },
              },
            },
          ],
        },
        PackDetails: {
          type: 'object',
          properties: {
            packSize: {
              type: 'integer',
              minimum: 1,
              errorMessage: {
                minimum: 'Pack size must be at least 1.',
              },
            },
            externalIdentifiers: {
              type: 'array',
              title: 'External identifiers',
              items: {
                $ref: '#/$defs/ExternalIdentifier',
              },
            },
          },
          required: ['packSize'],
        },
      },
      properties: {
        selectedProduct: {
          type: 'string',
          title: 'Selected Product',
        },
        existingPackSizes: {
          type: 'array',
          title: 'Existing Pack Sizes',
          items: {
            $ref: '#/$defs/PackDetails',
          },
        },
        packSizes: {
          type: 'array',
          title: 'New Pack Sizes',
          items: {
            $ref: '#/$defs/PackDetails',
          },
        },
        newPackSizeInput: {
          $ref: '#/$defs/PackDetails',
        },
        addButton: {
          type: 'null',
        },
      },
    },
  };
  //   },
  //   enabled: !!branchPath,
  // });
};

export const useUiSchemaQuery = (branchPath: string) => {
  // return useQuery({
  //   queryKey: ['bulk-pack-uiSchema', branchPath],
  //   // queryFn: () => ConfigService.fetchBulkPackUiSchemaData(branchPath),
  //   queryFn: () => async () => {
  return {
    isLoading: false,
    data: {
      'ui:options': {
        skipTitle: true,
      },
      'ui:grid': [
        {
          _columnA: 12,
          _columnB: 12,
        },
      ],
      _columnA: {
        'ui:grid': [
          {
            selectedProduct: 24,
          },
          {
            existingPackSizes: 24,
          },
        ],
      },
      _columnB: {
        'ui:title': null,
        'ui:options': {
          label: false,
        },
        'ui:grid': [
          {
            newPackSizeInput: 23,
            addButton: 1,
          },
          {
            packSizes: 24,
          },
        ],
      },
      selectedProduct: {
        'ui:readonly': true,
        'ui:widget': 'TitleWidget',
        'ui:options': {
          inputType: 'text',
          'ui:disabled': true,
          skipTitle: true,
        },
      },
      newPackSizeInput: {
        'ui:field': PackDetails,
        'ui:options': {
          readOnly: false,
          allowDelete: false,
          requireEditButton: false,
          binding: {
            atc: {
              valueSet: 'http://www.whocc.no/atc/vs',
            },
            pcrs: {
              valueSet: 'https://nmpc.hse.ie/PCRS/vs',
            },
          },
          multiValuedSchemes: ['atc', 'ean', 'pan', 'gtin'],
        },
      },

      addButton: {
        'ui:field': 'AddButtonField',
        'ui:options': {
          skipTitle: true,
          tooltipTitle: 'Add Pack Size',
          sourcePath: 'newPackSizeInput',
          targetPath: 'packSizes',
          isEnabled: (source: any, target: any) => {
            console.log('SOURCE: ' + JSON.stringify(source, null, 2));
            const packSize =
              source && typeof source === 'object' && source.packSize;
            return (
              !isNaN(packSize) &&
              target.filter((item: any) => item.packSize === packSize)
                .length === 0
            );
          },
          onAddClick: (source: any, target: any, clear: Function) => {
            target.push(source);
            clear();
          },
        },
      },
      existingPackSizes: {
        'ui:template': PackSizeArrayTemplate,
        'ui:options': {
          orderable: false,
          skipTitle: true,
          listTitle: 'Existing Pack Sizes',
          readOnly: true,
          allowDelete: false,
          requireEditButton: true,
          multiValuedSchemes: ['atc', 'ean', 'pan', 'gtin'],
          binding: {
            atc: {
              valueSet: 'http://www.whocc.no/atc/vs',
            },
            pcrs: {
              valueSet: 'https://nmpc.hse.ie/PCRS/vs',
            },
          },
        },
      },
      packSizes: {
        'ui:template': PackSizeArrayTemplate,
        'ui:options': {
          orderable: false,
          skipTitle: true,
          listTitle: 'Newly Added Pack Sizes',
          readOnly: false,
          allowDelete: true,
          requireEditButton: true,
        },
      },
    },
  };
  //   },
  //   enabled: !!branchPath,
  // }});
};
export default PackSizeAuthoring;
