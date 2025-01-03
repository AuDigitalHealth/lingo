import React from "react";
import { WidgetProps } from "@rjsf/core";
import ProductAutocompleteV3 from "./ProductAutocompleteV3";

const AutoCompleteWidget = ({
                               schema,
                               uiSchema,
                               formData,
                               onChange,
                           }: WidgetProps) => {
    const { branch, ecl, showDefaultOptions } = uiSchema["ui:options"] || {};

    const handleProductChange = (product: any) => {
        // Pass the full SnowstormConceptMini object back to the form
        onChange(product);
    };

    return (
        <ProductAutocompleteV3
            name={schema.title || "Product Name"}
            branch={branch || "MAIN"}
            ecl={ecl || "<DEFAULT_ECL_EXPRESSION>"}
            value={formData}
            onChange={handleProductChange}
            showDefaultOptions={showDefaultOptions || false}
        />
    );
};

export default AutoCompleteWidget;
