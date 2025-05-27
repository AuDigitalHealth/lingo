import React, { useEffect, useState } from "react";
import {
    Autocomplete,
    TextField,
    Chip,
    Box,
    Typography,
    Tooltip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Stack, Avatar, IconButton
} from "@mui/material";
import { FieldProps, RJSFSchema } from "@rjsf/utils";
import _ from "lodash";
import {Label} from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const SCHEME_COLORS = ["primary", "secondary", "success", "error", "warning"];

const getColorByScheme = (scheme: string) => {
    const index = scheme?.split("").reduce((a, b) => a + b.charCodeAt(0), 0) % SCHEME_COLORS.length;
    return SCHEME_COLORS[index];
};

interface ExternalIdentifier {
    identifierScheme: string;
    relationshipType: string;
    identifierValue: string;
}

const ExternalIdentifiers: React.FC<FieldProps<ExternalIdentifier[]>> = (props) => {
    const {
        onChange,
        schema,
        uiSchema,
        registry,
    } = props;

    const {
        optionsByScheme = {},
        schemeLimits = {},
        freeSoloByScheme = {},
        onChipClick,
        readOnly = true
    } = uiSchema && uiSchema["ui:options"] || {};

    const [ formData, setFormData ] = useState<ExternalIdentifier[]>(props.formData || []);

    const validator = registry.formContext?.validator || registry?.validator;
    const rootSchema: RJSFSchema = registry.rootSchema;

    const schemesInUse: string[] =
        schema?.items?.oneOf?.map((s) => s?.properties?.identifierScheme?.const) || [];

    const [selectedScheme, setSelectedScheme] = useState(schemesInUse[0]);
    const [availableOptions, setAvailableOptions] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [tooltip, setTooltip] = useState<string>("");

    const schemeColor = getColorByScheme(selectedScheme);
    const relationshipType =
        schema?.items?.oneOf?.find(
            (s) => s.properties?.identifierScheme?.const === selectedScheme
        )?.properties?.relationshipType?.const || "RELATED";

    const [ maxItems, setMaxItems ] = useState<number>(9999);
    const [freeSolo, setFreeSolo] = useState<boolean>(true);

    useEffect(() => {
        // @ts-ignore
        if (selectedScheme && schemeLimits && schemeLimits[selectedScheme]) {
            // @ts-ignore
            setMaxItems(schemeLimits[selectedScheme]);
        }
        // @ts-ignore
        if (selectedScheme && freeSoloByScheme && freeSoloByScheme[selectedScheme]) {
            // @ts-ignore
            setFreeSolo(freeSoloByScheme[selectedScheme]);
        }
    }, [selectedScheme, schemeLimits, freeSoloByScheme]);

    const schemeEntries = formData.filter(
        (f) => f.identifierScheme === selectedScheme
    );

    const otherEntries = formData.filter(
        (f) => f.identifierScheme !== selectedScheme
    );

    useEffect(() => {
        // @ts-ignore
        const opts = optionsByScheme[selectedScheme];
        if (typeof opts === "function") {
            opts().then(setAvailableOptions);
        } else if (Array.isArray(opts)) {
            setAvailableOptions(opts);
        } else {
            setAvailableOptions([]);
        }
    }, [selectedScheme, optionsByScheme]);

    const handleAdd = (value: string) => {

        const trimmed = value.trim();
        if (!trimmed) return;

        if (formData.some((item) => item.identifierValue === trimmed && item.identifierScheme === selectedScheme)) {
            setTooltip("This identifier is already added.");
            return;
        }

        if (maxItems && schemeEntries.length >= maxItems) {
            setTooltip(`Only ${maxItems} items allowed for ${selectedScheme}`);
            return;
        }

        const testObj: ExternalIdentifier = {
            identifierScheme: selectedScheme,
            relationshipType,
            identifierValue: trimmed,
        };

        const schemaDef = schema?.items?.oneOf?.find(
            (s) => s.properties?.identifierScheme?.const === selectedScheme
        );

        const tempSchema = {
            type: "object",
            properties: schemaDef?.properties || {},
            required: schemaDef?.required || []
        };

        // const result = validator.validateFormData(testObj, tempSchema, rootSchema);
        //
        // if (result.errors?.length > 0) {
        //     const idErr = result.errors.find((e) => e.property === ".identifierValue");
        //     setTooltip(idErr?.message || "Invalid value");
        //     return;
        // }

        setFormData([...formData, testObj]);
        onChange(formData);
    };

    const handleDelete = (value: string, scheme: string) => {
        onChange(formData.filter((item) =>
            !(item.identifierValue === value && item.identifierScheme === scheme)
        ));
    };

    const renderChip = (item: ExternalIdentifier, index: number) => (
        <Box display="flex" alignItems="center" gap={1}>
        {index === 0 && (
            <Typography variant="body2" color={getColorByScheme(item.identifierScheme)}>{item.identifierScheme}</Typography>
        )}
        <Chip
            variant="outlined"
            sx={{
                margin: 1,
                padding: 0.5
            }}
            key={`${item.identifierScheme}-${item.identifierValue}-${index}`}
            label={`${item.identifierValue}`}
            color={getColorByScheme(item.identifierScheme)}
            onClick={onChipClick ? () => onChipClick(item) : undefined}
            onDelete={!readOnly
                ? () => handleDelete(item.identifierValue, item.identifierScheme)
                : undefined
            }
        />
        </Box>
    );

    return (
        <Box>
            <Stack
                direction="row"
                spacing={2}
                alignItems="center"
            >
            {!readOnly && (
                <FormControl>
                    <InputLabel>Scheme</InputLabel>
                    <Select
                        sx={{
                            height: '36px',
                            width: 'max-content',
                            display: 'inline-table'
                        }}
                        value={selectedScheme}
                        label="Scheme"
                        onChange={(e) => {
                            setTooltip("");
                            setSelectedScheme(e.target.value);
                        }}
                    >
                    {schemesInUse.map((s) => (
                        <MenuItem key={s} value={s}>
                            {s?.toUpperCase()}
                        </MenuItem>
                    ))}
                </Select>
                </FormControl>
            )}
            <Autocomplete
                multiple
                sx={{
                    width: '100%',
                    padding: 0.5,
                    marginLeft: '10px !important',
                    marginRight: '10px !important',
                    '& fieldset': {
                    paddingTop: '0px !important',
                        borderTop: '0px !important',
                        borderLeft: '0px !important',
                        borderRight: '0px !important',
                    },
                }}
                disableClearable={true}
                disabled={readOnly}
                freeSolo={freeSolo}
                filterSelectedOptions
                options={availableOptions}
                getOptionLabel={(option) => option}
                value={schemeEntries.map((e) => e.identifierValue)}
                inputValue={inputValue}
                onInputChange={(_, newVal) => {
                    setInputValue(newVal);
                    setTooltip("");
                }}
                onChange={(_, values, reason, details) => {
                    if (reason === "selectOption" && details?.option) {
                        handleAdd(details.option);
                    } else if (reason === "createOption") {
                        handleAdd(values[values.length - 1]);
                    }
                }}
                renderTags={(values, getTagProps) =>
                    values.map((val, i) =>
                        renderChip({ identifierValue: val, identifierScheme: selectedScheme, relationshipType }, i)
                    )
                }
                renderInput={(params) =>
                    <TextField {...params} label="External Identifiers"
                               InputProps={{
                                   ...params.InputProps,
                                   endAdornment: readOnly ? null : params.InputProps.endAdornment,
                               }}
                    sx={{
                        margin: 1,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '0px 0px 0px 0px',
                            height: '36px',
                        }
                    }}/>
            }
            />
            </Stack>
        </Box>
    );
};

export default ExternalIdentifiers;
