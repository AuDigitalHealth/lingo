import React from 'react';
// import './App.css';
import {Form} from '@rjsf/mui';
import {Container} from "@mui/material";
import validator from '@rjsf/validator-ajv8';

import schema from "./MedicationProductDetails-schema.json";
import uiSchema from "./MedicationProductDetails-uiSchema.json";
import AutoCompleteWidget from "./AutoCompleteWidget.tsx";




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
                validator={validator}
                onChange={log('changed')}
                onSubmit={handleSubmit}
                onError={log('errors')}
                widgets={{AutoCompleteWidget}}
                liveValidate
            />
        </Container>
    );
}

export default MedicationAuthoringV2;