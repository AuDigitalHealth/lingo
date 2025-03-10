import React, {useCallback, useEffect, useState} from 'react';
import { RJSFSchema, UiSchema, withTheme } from '@rjsf/core';
import { Theme } from '@rjsf/mui';
import {
    Box,
    Button,
    Grid,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListSubheader,
    Paper,
    Alert,
    AlertTitle,
    Avatar,
} from '@mui/material';
import MedicationIcon from '@mui/icons-material/Medication';
import WarningModal from '../../../themes/overrides/WarningModal';
import useAuthoringStore from '../../../stores/AuthoringStore';
import { useFetchBulkAuthorBrands } from '../../../hooks/api/tickets/useTicketProduct';
import { findWarningsForBrandPackSizes } from '../../../types/productValidationUtils';
import { sortExternalIdentifiers } from '../../../utils/helpers/tickets/additionalFieldsUtils';
import schemaTest from './Brand-authoring-schema.json';
import uiSchemaTest from './Brand-authoring-uiSchema.json';
import { Concept } from '../../../types/concept.ts';
import type { ValueSetExpansionContains } from 'fhir/r4';
import { Task } from '../../../types/task.ts';
import { Ticket } from '../../../types/tickets/ticket.ts';
import ProductLoader from '../components/ProductLoader.tsx';
import ProductPreviewCreateModal from '../components/ProductPreviewCreateModal.tsx';
import { FieldChips } from '../components/ArtgFieldChips.tsx';
import { customizeValidator } from '@rjsf/validator-ajv8';
import ajvErrors from 'ajv-errors';
import AutoCompleteField from './fields/AutoCompleteField.tsx';
import ArtgArrayWidget from './widgets/ArtgArrayWidget.tsx';
import CustomFieldTemplate from './templates/CustomFieldTemplate.tsx';
import CustomArrayFieldTemplate from './templates/CustomArrayFieldTemplate.tsx';
import OneOfArrayWidget from "./widgets/OneOfArrayWidget.tsx";

const Form = withTheme(Theme);

export interface BrandAuthoringV2Props {
    selectedProduct: Concept | ValueSetExpansionContains | null;
    task: Task;
    ticket: Ticket;
    fieldBindings: any;
}

interface FormData {
    brands: Array<{
        brand: Concept;
        externalIdentifiers?: Array<{
            identifierScheme: 'artgid';
            relationshipType: 'RELATED';
            identifierValue: string;
        }>;
    }>;
}

const validator = customizeValidator();
ajvErrors(validator.ajv);

function BrandAuthoringV2({ selectedProduct, task, ticket, fieldBindings }: BrandAuthoringV2Props) {
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

    const [runningWarningsCheck, setRunningWarningsCheck] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [formData, setFormData] = useState<FormData>({ brands: [] });
    const { data, isFetching } = useFetchBulkAuthorBrands(selectedProduct, task.branchPath);



    const widgets = {
        ArtgArrayWidget,
        OneOfArrayWidget
    };

    const fields = {
        AutoCompleteField,
    };
    const handleClear = useCallback(() => {
        setFormData({}); // Reset form data to empty object
        if (formRef.current) {
            formRef.current.reset(); // Reset native form
        }
    }, []);

    useEffect(() => {
        if (selectedProduct) {
            setFormData({ brands: [] });
        }
    }, [selectedProduct]);

    const onSubmit = async ({ formData }: { formData: FormData }) => {
        setBrandPackSizePreviewDetails(undefined);
        setBrandPackSizePreviewDetails(formData);
        setRunningWarningsCheck(true);
        try {
            const warnings = await findWarningsForBrandPackSizes(formData, task.branchPath, fieldBindings);
            if (warnings.length > 0) {
                setWarnings(warnings);
                setPreviewModalOpen(false);
                setWarningModalOpen(true);
            } else {
                previewBrandPackSize(formData, ticket, task.branchPath, null, ticket.id);
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

    if (isFetching) return <ProductLoader message={`Loading Product details for ${selectedProduct?.pt?.term}`} />;
    if (loadingPreview) return <ProductLoader message={`Loading Product Preview for ${selectedProduct?.pt?.term}`} />;
    if (runningWarningsCheck) return <ProductLoader message={`Running validation before Preview`} />;
    if (!selectedProduct || !data) {
        return (
            <Alert severity="info">
                <AlertTitle>Info</AlertTitle>
                Search and select a product to create new brand(s).
            </Alert>
        );
    }
    const formContext = {
        onChange: (newFormData: any) => {
            setFormData(newFormData);
        },
        formData, // Pass full form data
    };
    return (
        <Box sx={{ width: '100%' }}>
            <Grid container>
                <WarningModal
                    open={warningModalOpen}
                    content={warnings.join('\n')}
                    handleClose={() => setWarningModalOpen(false)}
                    action="Proceed"
                    handleAction={() => previewBrandPackSize(formData, ticket, task.branchPath, null, ticket.id)}
                />
                <ProductPreviewCreateModal
                    productType="medication"
                    productCreationDetails={productCreationDetails}
                    handleClose={handlePreviewToggleModal}
                    open={previewModalOpen}
                    branch={task.branchPath}
                    ticket={ticket}
                />
                <Grid item sm={12} xs={12}>
                    <Paper>
                        <Box m={2} p={2}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Alert severity="info">Enter one or more new brands for the selected product.</Alert>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box border={1} borderColor="lightgray" p={1}>
                                        {selectedProduct?.pt?.term}
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Form
                                        schema={schemaTest}
                                        uiSchema={uiSchemaTest}
                                        formData={formData}
                                        onChange={({ formData }) => setFormData(formData)}
                                        onSubmit={onSubmit}
                                        widgets={widgets}
                                        fields={fields}
                                        templates={{
                                            FieldTemplate: CustomFieldTemplate,
                                            ArrayFieldTemplate: CustomArrayFieldTemplate,
                                        }}
                                        validator={validator}
                                        formContext={formContext}
                                    >
                                        <Box
                                            sx={{
                                                mt: 2,
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                                gap: 2,
                                            }}
                                        >
                                            <Button
                                                variant="outlined"
                                                color="secondary"
                                                onClick={handleClear}
                                            >
                                                Clear
                                            </Button>
                                            <Button type="submit" variant="contained" color="primary">
                                            Preview
                                        </Button>


                                        </Box>

                                    </Form>
                                </Grid>
                                <Grid item xs={6}>
                                    <List>
                                        <ListSubheader>Brands (Existing)</ListSubheader>
                                        {data.brands.map((brand) => (
                                            <ListItem key={brand.brand.id}>
                                                <ListItemAvatar>
                                                    <Avatar><MedicationIcon /></Avatar>
                                                </ListItemAvatar>
                                                <Box>
                                                    <ListItemText primary={brand.brand.pt?.term} />
                                                    <FieldChips items={sortExternalIdentifiers(brand.externalIdentifiers)} />
                                                </Box>
                                            </ListItem>
                                        ))}
                                    </List>
                                </Grid>

                            </Grid>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default BrandAuthoringV2;