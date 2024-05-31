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
} from '@mui/material';
import { Concept } from '../../../types/concept.ts';
import useDebounce from '../../../hooks/useDebounce.tsx';
import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';
import MedicationIcon from '@mui/icons-material/Medication';
import { Stack } from '@mui/system';
import IconButton from '../../../components/@extended/IconButton.tsx';
import { Link } from 'react-router-dom';
import {
  isDeviceType,
  isFsnToggleOn,
} from '../../../utils/helpers/conceptUtils.ts';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import {
  useSearchConcept,
  useSearchConceptOntoserver,
} from '../../../hooks/api/products/useSearchConcept.tsx';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';

import { ProductType } from '../../../types/product.ts';
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

export interface ConceptSearchResult extends Concept {
  type: string;
}

export interface SearchProductProps {
  disableLinkOpen: boolean;
  handleChange?: (
    concept: Concept | ValueSetExpansionContains | undefined,
    productType: ProductType,
  ) => void;
  providedEcl?: string;
  inputValue: string;
  setInputValue: (value: string) => void;
  showDeviceSearch: boolean;
  showConfirmationModalOnChange?: boolean;
  branch: string;
  fieldBindings: FieldBindings;
  hideAdvancedSearch?: boolean;
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
}: SearchProductProps) {
  const localFsnToggle = isFsnToggleOn;
  const [results, setResults] = useState<Concept[]>([]);
  const [open, setOpen] = useState(false);

  const [fsnToggle, setFsnToggle] = useState(localFsnToggle);
  const [searchFilter, setSearchFilter] = useState('Term');
  const filterTypes = ['Term', 'Artg Id', 'Sct Id'];

  const [disabled, setDisabled] = useState(false);
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [switchProductTypeOpen, setSwitchProductTypeOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<
    ConceptSearchResult | undefined | null
  >();
  const { selectedProductType } = useAuthoringStore();

  const [deviceToggle, setDeviceToggle] = useState(
    isDeviceType(selectedProductType) ? true : false,
  );

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
          deviceToggle ? ProductType.device : ProductType.medication,
        );
    }
    setChangeModalOpen(false);
  };

  const handleProductTypeChange = () => {
    setInputValue('');

    const toggleChange = !deviceToggle;
    setDeviceToggle(toggleChange);
    if (handleChange)
      handleChange(
        undefined,
        toggleChange ? ProductType.device : ProductType.medication,
      );
    setSwitchProductTypeOpen(false);
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
    }
  }, [inputValue]);

  const debouncedSearch = useDebounce(inputValue, 400);

  let ecl = providedEcl;

  if (!providedEcl) {
    ecl = generateEclFromBinding(fieldBindings, 'product.search');
    if (showDeviceSearch) {
      if (deviceToggle) {
        ecl = generateEclFromBinding(fieldBindings, 'deviceProduct.search');
      } else {
        ecl = generateEclFromBinding(fieldBindings, 'medicationProduct.search');
      }
    }
  }
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
  }, [ontoResults, results]);

  useEffect(() => {
    if (ontoData) {
      setOntoResults(
        ontoData.expansion?.contains !== undefined
          ? convertFromValueSetExpansionContainsListToSnowstormConceptMiniList(
              ontoData.expansion.contains,
            )
          : ([] as Concept[]),
      );
    }
  }, [ontoData]);

  useEffect(() => {
    if (data !== undefined) {
      localStorage.setItem('fsn_toggle', fsnToggle.toString());
      setResults(data.items);
      setOpen(true);
    }
  }, [data, deviceToggle]);

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
          handleAction={() => {
            // if(selectedValue && selectedValue !== null) {
            handleProductTypeChange();
            // }
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
              // size='small'
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
            }}
            onChange={(e, v) => {
              setSelectedValue(v !== null ? v : undefined);
              if (showConfirmationModalOnChange && v !== null) {
                setChangeModalOpen(true);
              } else {
                // TODO: fix this
                if (handleChange)
                  handleChange(
                    v ? v : undefined,
                    deviceToggle ? ProductType.device : ProductType.medication,
                  );
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
                    borderRadius: '0px 4px 4px 0px',
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
              return (
                <li {...props}>
                  {!disableLinkOpen ? (
                    <Link
                      to={linkPath(
                        isValueSetExpansionContains(option)
                          ? (option.code as string)
                          : (option.conceptId as string),
                      )}
                      style={{ textDecoration: 'none', color: '#003665' }}
                    >
                      {optionComponent(option, selected, fsnToggle)}
                    </Link>
                  ) : (
                    <div style={{ textDecoration: 'none', color: '#003665' }}>
                      {' '}
                      {optionComponent(option, selected, fsnToggle)}{' '}
                    </div>
                  )}
                </li>
              );
            }}
          />
          <IconButton
            variant={fsnToggle ? 'contained' : 'outlined'}
            color="primary"
            sx={{ width: '90px', marginLeft: 'auto' }}
            aria-label="toggle-task-menu"
            onClick={handleTermDisplayToggleChange}
          >
            <span style={{ fontSize: 'small' }}>
              {fsnToggle ? 'FSN' : 'PT'}{' '}
            </span>
          </IconButton>
          {showDeviceSearch ? (
            <IconButton
              variant={deviceToggle ? 'contained' : 'outlined'}
              sx={{ width: '90px' }}
              color="primary"
              aria-label="toggle-task-menu"
              onClick={() => {
                if (selectedValue && selectedValue !== null) {
                  setSwitchProductTypeOpen(true);
                } else {
                  const toggleChange = !deviceToggle;
                  setDeviceToggle(toggleChange);
                  if (handleChange)
                    handleChange(
                      undefined,
                      toggleChange
                        ? ProductType.device
                        : ProductType.medication,
                    );
                }
              }}
            >
              <span style={{ fontSize: 'small' }}>
                {deviceToggle
                  ? ProductType.device.toUpperCase()
                  : ProductType.medication.toUpperCase()}{' '}
              </span>
            </IconButton>
          ) : (
            <div></div>
          )}
          {!hideAdvancedSearch ? (
            <Button
              variant={'text'}
              color="primary"
              sx={{ width: '150px' }}
              aria-label="toggle-task-menu"
              onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
            >
              Advanced Search
            </Button>
          ) : (
            <div></div>
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
