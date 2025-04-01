import React from 'react';
import { ObjectFieldTemplateProps } from '@rjsf/utils';
import { Grid } from '@mui/material';

const CustomObjectFieldTemplate = (props: ObjectFieldTemplateProps) => {
    const { properties, uiSchema } = props;
    const useHorizontalLayout = uiSchema['ui:options']?.useHorizontalLayout || false;

    if (useHorizontalLayout) {
        // Horizontal layout (left to right)
        return (
            <Grid container spacing={2} direction="row" alignItems="center">
                {properties.map((element) => (
                    <Grid item xs={6} key={element.name}>
                        {element.content}
                    </Grid>
                ))}
            </Grid>
        );
    } else {
        // Default vertical stacking
        return (
            <div>
                {properties.map((element) => (
                    <div key={element.name} style={{ marginBottom: '30px' }}>
                        {element.content}
                    </div>
                ))}
            </div>
        );
    }
};

export default CustomObjectFieldTemplate;