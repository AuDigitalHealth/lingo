import React from "react";
import { WidgetProps } from "@rjsf/core";
import { Typography, Grid } from "@mui/material";

const SectionWidget = ({ schema, uiSchema, children }: WidgetProps) => {
    const title = uiSchema["ui:title"] || "Section"; // Default title if no title is provided

    return (
        <div style={{ marginBottom: "20px" }}>
            {/* Section Title */}
            <Typography variant="h6" gutterBottom>{title}</Typography>

            {/* Wrap fields inside Grid for layout */}
            <Grid container spacing={2}>
                {children} {/* Render the fields inside the section */}
            </Grid>
        </div>
    );
};

export default SectionWidget;
