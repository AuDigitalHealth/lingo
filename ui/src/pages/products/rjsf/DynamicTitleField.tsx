import React, { useState, useEffect } from "react";

const DynamicTitleField = ({ formData, schema, uiSchema, onChange }) => {
    const [dynamicTitle, setDynamicTitle] = useState(schema.title);

    useEffect(() => {
        if (formData?.ProductName) {
            setDynamicTitle(`Product: ${formData.ProductName}`);
        } else {
            setDynamicTitle("Contained Product");
        }
    }, [formData]);

    return (
        <fieldset>
            <legend>{dynamicTitle}</legend>
            <div>
                {Object.entries(schema.properties).map(([key, propertySchema]) => (
                    <div key={key}>
                        <label>{propertySchema.title}</label>
                        <input
                            type="text"
                            value={formData?.[key] || ""}
                            onChange={(e) => onChange({ ...formData, [key]: e.target.value })}
                        />
                    </div>
                ))}
            </div>
        </fieldset>
    );
};

export default DynamicTitleField;
