import React from 'react';
// import './App.css';
import {Form} from '@rjsf/mui';
import {Container} from "@mui/material";
import validator from '@rjsf/validator-ajv8';

import schema from "./MedicationProductDetails-schema.json";
import uiSchema from "./MedicationProductDetails-uiSchema.json";

import UnitValueField from "./UnitValueField.tsx";
import AutoCompleteField from "./AutoCompleteField.tsx";





function MedicationAuthoringV2() {
    const handleSubmit = ({ formData }: any) => {
        console.log("Submitted data:", formData);
    };


    const log = (type) => console.log.bind(console, type);

    return (
        <Container>
            <Form
                schema={schema}
                uiSchema={uiSchema}
                fields={{ UnitValueField,AutoCompleteField}}
                widgets={{ }}
                formData={{}}
                onChange={({ formData }) => console.log("Changed:", formData)} // Log changes
                onSubmit={({ formData }) => console.log("Submitted:", formData)} // Log submission
                onError={(errors) => console.log("Errors:", errors)} // Log errors
                validator={validator}

            />

        </Container>
    );
}

export default MedicationAuthoringV2;