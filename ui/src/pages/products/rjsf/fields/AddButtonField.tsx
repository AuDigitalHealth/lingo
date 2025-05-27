import React from "react";
import { FieldProps } from "@rjsf/utils";
import _ from "lodash";
import {IconButton, Tooltip} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

interface AddButtonProps extends FieldProps {
    formContext?: {
        formData: any;
        onFormDataChange?: (newFormData: any) => void;
    };
}

const AddButtonField: React.FC<AddButtonProps> = (props) => {
    const { uiSchema, formContext } = props;
    const {
        formData = {},
        // @ts-ignore
        onFormDataChange = () => {}
    } = formContext;

    const {
        sourcePath,
        targetPath,
        onAddClick,
        isEnabled,
        tooltipTitle
    } = uiSchema && uiSchema["ui:options"] || {};

    const source = _.get(formData, sourcePath);
    const target = _.get(formData, targetPath);

    const clear = () => {
        if (sourcePath) {
            const updated = _.cloneDeep(formData);
            _.unset(updated, sourcePath);
            onFormDataChange(updated);
        }
    };

    const enabled = typeof isEnabled === "function"
        ? isEnabled(source, target)
        : true;

    const handleClick = () => {
        if (typeof onAddClick === "function") {
            onAddClick(source, target, clear);
        }
    };

    const toolTip = tooltipTitle || "Add Item";

    return (
        <Tooltip title={"" + toolTip}>
            <IconButton
                disabled={!enabled}
                onClick={handleClick}
                color="primary"
                aria-label={"" + toolTip}
            >
                <AddCircleOutlineIcon />
            </IconButton>
        </Tooltip>
    );
};

export default AddButtonField;
