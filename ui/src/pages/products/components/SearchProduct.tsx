import React, { useEffect, useState } from 'react';
import {
  Autocomplete,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import { Concept } from '../../../types/concept.ts';
import useDebounce from '../../../hooks/useDebounce.tsx';
import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';
import MedicationIcon from '@mui/icons-material/Medication';
import { Stack } from '@mui/system';
import { Link } from 'react-router-dom';
import { isFsnToggleOn } from '../../../utils/helpers/conceptUtils.ts';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import {
  useSearchConcept,
  useSearchConceptOntoserver,
} from '../../../hooks/api/products/useSearchConcept.tsx';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';

import { ActionType, ProductType } from '../../../types/product.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';
import { generateEclFromBinding } from '../../../utils/helpers/EclUtils.ts';
import { ConceptSearchSidebar } from '../../../components/ConceptSearchSidebar.tsx';
import useAuthoringStore from '../../../stores/AuthoringStore.ts';

import type { ValueSetExpansionContains } from 'fhir/r4';
import { isValueSetExpansionContains } from '../../../types/predicates/isValueSetExpansionContains.ts';
import { convertFromValueSetExpansionContainsListToSnowstormConceptMiniList } from '../../../utils/helpers/getValueSetExpansionContainsPt.ts';
import {
  PUBLISHED_CONCEPTS,
  UNPUBLISHED_CONCEPTS,
} from '../../../utils/statics/responses.ts';
import useApplicationConfigStore from '../../../stores/ApplicationConfigStore.ts';

export interface ConceptSearchResult extends Concept {
  type: string;
}

export interface SearchProductProps {
  disableLinkOpen: boolean;
  handleChange?: (
    concept: Concept | ValueSetExpansionContains | undefined,
    productType: ProductType,
    actionType: ActionType,
  ) => void;
  providedEcl?: string;
  inputValue: string;
  setInputValue: (value: string) => void;
  showDeviceSearch: boolean;
  showConfirmationModalOnChange?: boolean;
  branch: string;
  fieldBindings: FieldBindings;
  hideAdvancedSearch?: boolean;
  actionType?: ActionType;
}
export default function SearchProduct({
  disableLinkOpen,
  handleChange,
  providedEcl,
  inputValue,
  setInputValue,
  showConfirmationModalOnChange,
  showDeviceSearch,
  branch,
  fieldBindings,
  hideAdvancedSearch,
  actionType,
}: SearchProductProps) {
  const localFsnToggle = isFsnToggleOn;
  const [results, setResults] = useState<Concept[]>([]);
  const [open, setOpen] = useState(false);

  const { applicationConfig } = useApplicationConfigStore();

  const [fsnToggle, setFsnToggle] = useState(localFsnToggle);
  const [searchFilter, setSearchFilter] = useState('Term');
  const filterTypes = ['Term', 'Artg Id', 'Sct Id'];
  const termTypes = ['FSN', 'PT'];

  const [disabled] = useState(false);
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [switchProductTypeOpen, setSwitchProductTypeOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<
    ConceptSearchResult | undefined | null
  >();
  const { selectedProduct } = useAuthoringStore();

  const [switchActionTypeOpen, setSwitchActionTypeOpen] = useState(false);

  const [selectedActionType, setSelectedActionType] = useState<ActionType>(
    actionType ? actionType : ActionType.newProduct,
  );

  const [newActionType, setNewActionType] = useState<ActionType>(
    ActionType.newProduct,
  );

  const generateEcl = (
    providedEcl: string | undefined,
    actionType: ActionType,
  ) => {
    if (providedEcl) return providedEcl;

    let returnVal = undefined;
    switch (actionType) {
      case ActionType.newBrand:
        returnVal = generateEclFromBinding(
          fieldBindings,
          'bulk.new-brand-pack-sizes',
        );
        break;
      case ActionType.newDevice:
        returnVal = generateEclFromBinding(
          fieldBindings,
          'deviceProduct.search',
        );
        break;
      case ActionType.newPackSize:
        returnVal = generateEclFromBinding(
          fieldBindings,
          'bulk.new-brand-pack-sizes',
        );
        break;
      case ActionType.newMedication:
        returnVal = generateEclFromBinding(
          fieldBindings,
          'medicationProduct.search',
        );
        break;
      case ActionType.newVaccine:
        returnVal = generateEclFromBinding(
          fieldBindings,
          'vaccineProduct.search',
        );
        break;
      case ActionType.newNutritionalProduct:
        returnVal = generateEclFromBinding(
          fieldBindings,
          'nutritionalProduct.search',
        );
        break;
      default:
        returnVal = generateEclFromBinding(fieldBindings, 'product.search'); //default to all product search
        break;
    }
    return returnVal;
  };

  const [ecl, setEcl] = useState<string | undefined>(
    generateEcl(providedEcl, selectedActionType),
  );

  useEffect(() => {
    setEcl(generateEcl(providedEcl, selectedActionType));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedActionType]);

  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);

  const handleTermDisplayToggleChange = () => {
    setFsnToggle(!fsnToggle);
  };
  const handleSearchFilter = (event: SelectChangeEvent) => {
    setInputValue('');
    setSearchFilter(event.target.value);
  };
  const checkItemAlreadyExists = (search: string): boolean => {
    const result = results.filter(
      concept =>
        search.includes(concept.conceptId as string) ||
        search.includes(concept.pt?.term as string) ||
        search.includes(concept.fsn?.term as string),
    );
    return result.length > 0 ? true : false;
  };

  const handleOnChange = () => {
    if (selectedValue) {
      if (handleChange)
        handleChange(
          selectedValue,
          selectedActionType === ActionType.newDevice
            ? ProductType.device
            : ProductType.medication,
          selectedActionType,
        );
    }
    setChangeModalOpen(false);
  };

  const handleProductTypeChange = () => {
    setInputValue('');
    if (handleChange)
      handleChange(
        undefined,
        selectedActionType === ActionType.newDevice
          ? ProductType.device
          : ProductType.medication,
        selectedActionType,
      );
    setSwitchProductTypeOpen(false);
    setSelectedActionType(newActionType);
  };

  const handleActionTypeChangeConfirmation = () => {
    setInputValue('');
    setSelectedActionType(newActionType);
    if (handleChange)
      handleChange(
        undefined,
        newActionType === ActionType.newDevice
          ? ProductType.device
          : ProductType.medication,
        newActionType,
      );

    setSwitchActionTypeOpen(false);
  };

  const linkPath = (conceptId: string): string => {
    return disableLinkOpen
      ? '/dashboard/products/' + conceptId + '/authoring'
      : '/dashboard/products/' + conceptId;
  };

  useEffect(() => {
    // if the user starts typing again
    if (inputValue === '' || !inputValue) {
      setResults([]);
      setOntoResults([]);
    }
  }, [inputValue]);

  const debouncedSearch = useDebounce(inputValue, 400);

  const [ontoResults, setOntoResults] = useState<Concept[]>([]);
  const [allData, setAllData] = useState<ConceptSearchResult[]>([
    ...results.map(item => ({ ...item, type: UNPUBLISHED_CONCEPTS })),
    ...ontoResults.map(item => ({ ...item, type: PUBLISHED_CONCEPTS })),
  ]);

  const { data, isFetching } = useSearchConcept(
    searchFilter,
    debouncedSearch,
    checkItemAlreadyExists,
    branch,
    encodeURIComponent(ecl as string),
    allData,
  );

  const { data: ontoData, isFetching: isOntoFetching } =
    useSearchConceptOntoserver(
      encodeURIComponent(ecl as string),
      debouncedSearch,
      searchFilter,
      allData,
    );

  useEffect(() => {
    if (ontoResults || results) {
      let tempAllData: ConceptSearchResult[] = [];
      if (ontoResults) {
        tempAllData = [
          ...ontoResults.map(item => ({
            ...item,
            type: 'Published Concepts',
          })),
        ];
      }
      if (results) {
        const tempArr = results?.map(item => ({
          ...item,
          type: 'Unpublished Concepts',
        }));
        tempAllData.push(...tempArr);
      }
      setAllData(tempAllData);
    }
    if (!ontoResults && !results) {
      setAllData([]);
    }
  }, [ontoResults, results]);

  useEffect(() => {
    if (ontoData) {
      setOntoResults(
        ontoData.expansion?.contains !== undefined
          ? convertFromValueSetExpansionContainsListToSnowstormConceptMiniList(
              ontoData.expansion.contains,
              applicationConfig.fhirPreferredForLanguage,
            )
          : ([] as Concept[]),
      );
      return;
    }
    setOntoResults([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ontoData]);

  useEffect(() => {
    if (data) {
      localStorage.setItem('fsn_toggle', fsnToggle.toString());
      setResults(data.items);
    }
  }, [data, fsnToggle]);

  return (
    <>
      <Grid item xs={12} sm={12} md={12} lg={12}>
        <ConfirmationModal
          open={changeModalOpen}
          content={
            'Unsaved changes to the product details will be lost. Continue?'
          }
          handleClose={() => {
            setChangeModalOpen(false);
          }}
          title={'Confirm Load Product'}
          disabled={disabled}
          action={'Proceed'}
          handleAction={handleOnChange}
        />
        <ConfirmationModal
          open={switchProductTypeOpen}
          content={
            'Unsaved changes to the product details will be lost. Continue?'
          }
          handleClose={() => {
            setSwitchProductTypeOpen(false);
          }}
          title={'Confirm Change the Product type'}
          disabled={disabled}
          action={'Proceed'}
          handleAction={handleProductTypeChange}
        />
        <ConfirmationModal
          open={switchActionTypeOpen}
          content={
            'Unsaved changes to the product details will be lost. Continue?'
          }
          handleClose={() => {
            setSwitchActionTypeOpen(false);
          }}
          title={'Confirm Change the Action type'}
          disabled={disabled}
          action={'Proceed'}
          handleAction={() => {
            handleActionTypeChangeConfirmation();
          }}
        />
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          paddingLeft="1rem"
        >
          <FormControl>
            <InputLabel id="demo-simple-select-label">Search Filter</InputLabel>
            <Select
              data-testid="search-product-filter-input"
              sx={{
                width: '120px',
                height: '36px',
                borderRadius: '4px 0px 0px 4px',
              }}
              labelId="concept-search-filter-label"
              value={searchFilter}
              label="Filter"
              onChange={handleSearchFilter}
            >
              {filterTypes.map(type => (
                <MenuItem
                  key={type}
                  value={type}
                  onKeyDown={e => e.stopPropagation()}
                >
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Autocomplete
            data-testid="search-product-input"
            slotProps={{ clearIndicator: { type: 'button' } }}
            loading={isFetching || isOntoFetching}
            sx={{
              width: '400px',
              borderRadius: '0px 4px 4px 0px',
              marginLeft: '0px !important',
              '& fieldset': {
                borderLeft: '0px !important',
                borderRight: '0px !important',
              },
            }}
            isOptionEqualToValue={(option, value) => {
              return option.conceptId === value.conceptId;
            }}
            onChange={(e, v) => {
              setSelectedValue(v !== null ? v : undefined);
              if (showConfirmationModalOnChange && v !== null) {
                setChangeModalOpen(true);
              } else {
                if (handleChange) {
                  let productType: ProductType;
                  switch (selectedActionType) {
                    case ActionType.newDevice:
                      productType = ProductType.device;
                      break;
                    case ActionType.newMedication:
                      productType = ProductType.medication;
                      break;
                    case ActionType.newVaccine:
                      productType = ProductType.vaccine;
                      break;
                    case ActionType.newNutritionalProduct:
                      productType = ProductType.nutritional;
                      break;
                    default:
                      productType = ProductType.medication;
                  }
                  handleChange(
                    v ?? undefined,
                    productType,
                    selectedActionType || ActionType.newMedication,
                  );
                }
              }
            }}
            open={open}
            getOptionLabel={option =>
              getTermDisplay(option, fsnToggle) +
                '[' +
                (isValueSetExpansionContains(option)
                  ? (option.code as string)
                  : (option.conceptId as string)) +
                ']' || ''
            }
            filterOptions={x => x}
            autoComplete
            aria-valuemin={3}
            onOpen={() => {
              if (inputValue) {
                setOpen(true);
              }
            }}
            onClose={() => setOpen(false)}
            inputValue={inputValue}
            onInputChange={(e, value) => {
              if (e !== null) {
                setInputValue(value);
                if (!value) {
                  setOpen(false);
                  setAllData([]);
                  setResults([]);
                }
              }
            }}
            groupBy={option => option.type}
            options={allData}
            value={
              inputValue === '' ? null : selectedValue ? selectedValue : null
            }
            renderInput={params => (
              <TextField
                {...params}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '0px 0px 0px 0px',
                    height: '36px',
                  },
                }}
                label="Search for a concept"
                variant="outlined"
                size="small"
                data-testid={'search-product-textfield'}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {/* So we can show two different loadings, one for onto, one for snowstorm */}
                      {isOntoFetching ? (
                        <CircularProgress color="success" size={20} />
                      ) : null}
                      {isFetching ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option, { selected }) => {
              const key = isValueSetExpansionContains(option)
                ? option.code
                : option.conceptId;

              return (
                <li {...props} key={key}>
                  {!disableLinkOpen ? (
                    <Link
                      to={linkPath(key)}
                      style={{ textDecoration: 'none', color: '#003665' }}
                    >
                      {optionComponent(option, selected, fsnToggle)}
                    </Link>
                  ) : (
                    <div style={{ textDecoration: 'none', color: '#003665' }}>
                      {optionComponent(option, selected, fsnToggle)}
                    </div>
                  )}
                </li>
              );
            }}
          />
          <FormControl
            sx={{
              marginLeft: '0px !important',
              paddingLeft: '0px !important',
            }}
          >
            <InputLabel id="term-display-filter-label">Display Type</InputLabel>
            <Select
              data-testid="search-product-display-type"
              sx={{
                width: '120px',
                height: '36px',
                marginLeft: '0px !important',
                paddingLeft: '0px !important',
                borderRadius: '0px 4px 4px 0px',
              }}
              labelId="term-display-filter-label"
              onChange={handleTermDisplayToggleChange}
              value={fsnToggle ? 'FSN' : 'PT'}
            >
              {termTypes.map(type => (
                <MenuItem
                  key={type}
                  value={type}
                  onKeyDown={e => e.stopPropagation()}
                >
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {!hideAdvancedSearch ? (
            <Button
              variant={'text'}
              color="primary"
              aria-label="toggle-task-menu"
              sx={{
                '&.MuiButton-root': {
                  marginLeft: '0px',
                },
              }}
              onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
            >
              <TuneIcon
                sx={{ padding: '0px !important' }}
                fontSize="small"
              ></TuneIcon>
            </Button>
          ) : (
            <span></span>
          )}
          {showDeviceSearch ? (
            <span>
              <ToggleButtonGroup
                className={''}
                color="primary"
                size="small"
                exclusive
                disabled={false}
                value={selectedActionType}
                onChange={(
                  event: React.MouseEvent<HTMLElement>,
                  newValue: keyof typeof ActionType,
                ) => {
                  if (
                    newValue !== null &&
                    selectedActionType &&
                    newValue !== selectedActionType.toString()
                  ) {
                    if (selectedProduct) {
                      setNewActionType(ActionType[newValue]);
                      setSwitchActionTypeOpen(true);
                    } else {
                      setSelectedActionType(ActionType[newValue]);
                      setInputValue('');

                      if (handleChange) {
                        handleChange(
                          undefined,
                          ActionType[newValue] === ActionType.newDevice
                            ? ProductType.device
                            : ProductType.medication,
                          ActionType[newValue],
                        );
                      }
                    }
                  }
                }}
              >
                <ToggleButton
                  value={ActionType.newDevice}
                  data-testid={'device-toggle'}
                >
                  Device
                </ToggleButton>
                <ToggleButton
                  value={ActionType.newMedication}
                  data-testid={'medication-toggle'}
                >
                  Medication
                </ToggleButton>
                <ToggleButton
                  value={ActionType.newVaccine}
                  data-testid={'vaccine-toggle'}
                >
                  Vaccine
                </ToggleButton>
                <ToggleButton
                  value={ActionType.newNutritionalProduct}
                  data-testid={'nutritional-toggle'}
                >
                  Nutritional Product
                </ToggleButton>
                <ToggleButton
                  value={ActionType.newPackSize}
                  data-testid={'bulk-pack-toggle'}
                >
                  New Pack Sizes
                </ToggleButton>
                <ToggleButton
                  value={ActionType.newBrand}
                  data-testid={'bulk-brand-toggle'}
                >
                  New Brands
                </ToggleButton>
                <ToggleButton value={ActionType.editProduct}>
                  Edit Terms
                </ToggleButton>
              </ToggleButtonGroup>
            </span>
          ) : (
            <span></span>
          )}
        </Stack>
      </Grid>
      <ConceptSearchSidebar
        open={advancedSearchOpen}
        toggle={setAdvancedSearchOpen}
        title={'Advanced Search'}
      />
    </>
  );
}
const optionComponent = (
  option: Concept | ValueSetExpansionContains,
  selected: boolean,
  fsnToggle: boolean,
) => {
  return (
    <Stack direction="row" spacing={2}>
      <Box
        component={MedicationIcon}
        sx={{
          width: 20,
          height: 20,
          flexShrink: 0,
          borderRadius: '3px',
          mr: 1,
          mt: '2px',
        }}
      />
      <Box
        sx={{
          flexGrow: 1,
          '& span': {
            color: '#586069',
          },
        }}
      >
        {getTermDisplay(option, fsnToggle)}
        <br />
        <span>
          {isValueSetExpansionContains(option) ? option.code : option.conceptId}
        </span>
      </Box>
      <Box
        component={CloseIcon}
        sx={{ opacity: 0.6, width: 18, height: 18 }}
        style={{
          visibility: selected ? 'visible' : 'hidden',
        }}
      />
    </Stack>
  );
};
const getTermDisplay = (
  concept: Concept | ValueSetExpansionContains,
  fsnToggle: boolean,
): string => {
  if (isValueSetExpansionContains(concept)) {
    return concept.display as string;
  }
  return fsnToggle
    ? (concept.fsn?.term as string)
    : (concept.pt?.term as string);
};
