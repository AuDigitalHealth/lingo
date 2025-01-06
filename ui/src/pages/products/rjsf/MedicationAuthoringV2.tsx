import React from 'react';
// import './App.css';
import {Form} from '@rjsf/mui';
import {Container} from "@mui/material";
import validator from '@rjsf/validator-ajv8';

import schema from "./MedicationProductDetails-schema.json";
import uiSchema from "./MedicationProductDetails-uiSchema.json";
import AutoCompleteWidget from "./AutoCompleteWidget.tsx";
import UnitValueField from "./UnitValueField.tsx";





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
                formData={{ productName: "" }}
                onChange={({ formData }) => console.log("Changed:", formData)} // Log changes
                onSubmit={({ formData }) => console.log("Submitted:", formData)} // Log submission
                onError={(errors) => console.log("Errors:", errors)} // Log errors
                fields={{  UnitValueField}}
                widgets={{ AutoCompleteWidget }}
                validator={validator}

            />

        </Container>
    );
}

export default MedicationAuthoringV2;