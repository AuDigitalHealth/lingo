import React, { useEffect, useState } from 'react';
import {
  Autocomplete,
  Button,
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
import { isFsnToggleOn } from '../../../utils/helpers/conceptUtils.ts';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useSearchConcept } from '../../../hooks/api/products/useSearchConcept.tsx';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';

import { ProductType } from '../../../types/product.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';
import { generateEclFromBinding } from '../../../utils/helpers/EclUtils.ts';
import { GenericSidebar } from '../../../components/GenericSidebar.tsx';

export interface SearchProductProps {
  disableLinkOpen: boolean;
  handleChange?: (concept: Concept | null, productType: ProductType) => void;
  providedEcl?: string;
  inputValue: string;
  setInputValue: (value: string) => void;
  showDeviceSearch: boolean;
  showConfirmationModalOnChange?: boolean;
  branch: string;
  fieldBindings: FieldBindings;
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
}: SearchProductProps) {
  const localFsnToggle = isFsnToggleOn;
  const [results, setResults] = useState<Concept[]>([]);
  const [open, setOpen] = useState(false);
  // const [inputValue, setInputValue] = useState('');
  const [fsnToggle, setFsnToggle] = useState(localFsnToggle);
  const [deviceToggle, setDeviceToggle] = useState(false);
  const [searchFilter, setSearchFilter] = useState('Term');
  const filterTypes = ['Term', 'Artg Id', 'Sct Id'];

  const [disabled, setDisabled] = useState(false);
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [switchProductTypeOpen, setSwitchProductTypeOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<
    Concept | undefined | null
  >();

  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);

  const handleTermDisplayToggleChange = () => {
    setFsnToggle(!fsnToggle);
  };
  const handleSearchFilter = (event: SelectChangeEvent) => {
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
    // setSelectedValue(null);
    // setResults([]);
    const toggleChange = !deviceToggle;
    setDeviceToggle(toggleChange);
    if (handleChange)
      handleChange(
        null,
        toggleChange ? ProductType.device : ProductType.medication,
      );
    setSwitchProductTypeOpen(false);
  };

  const linkPath = (conceptId: string): string => {
    return disableLinkOpen
      ? '/dashboard/products/' + conceptId + '/authoring'
      : '/dashboard/products/' + conceptId;
  };

  const debouncedSearch = useDebounce(inputValue, 400);

  let ecl = providedEcl;
  if (!providedEcl) {
    console.log('genere ecl from bindings');
    ecl = generateEclFromBinding(fieldBindings, 'product.search');
    if (showDeviceSearch) {
      if (deviceToggle) {
        ecl = generateEclFromBinding(fieldBindings, 'deviceProduct.search');
      } else {
        ecl = generateEclFromBinding(fieldBindings, 'medicationProduct.search');
      }
    }
  }
  console.log(ecl);
  const { isLoading, data } = useSearchConcept(
    searchFilter,
    debouncedSearch,
    checkItemAlreadyExists,
    branch,
    encodeURIComponent(ecl as string),
  );

  useEffect(() => {
    if (data !== undefined) {
      localStorage.setItem('fsn_toggle', fsnToggle.toString());
      setResults(data.items);
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
            slotProps={{ clearIndicator: { type: 'button' } }}
            loading={isLoading}
            sx={{
              width: '400px',
              borderRadius: '0px 4px 4px 0px',
              marginLeft: '0px !important',
            }}
            // onChange={(e, v) => setActiveProduct(v)}
            onChange={(e, v) => {
              setSelectedValue(v !== null ? v : undefined);
              if (showConfirmationModalOnChange && v !== null) {
                setChangeModalOpen(true);
              } else {
                if (handleChange)
                  handleChange(
                    v,
                    deviceToggle ? ProductType.device : ProductType.medication,
                  );
              }
            }}
            open={open}
            getOptionLabel={option =>
              getTermDisplay(option, fsnToggle) +
                '[' +
                (option.conceptId as string) +
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
                  setResults([]);
                }
              }
            }}
            options={results}
            value={
              inputValue === '' ? null : selectedValue ? selectedValue : null
            }
            renderInput={params => (
              <TextField
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '0px 4px 4px 0px',
                    height: '36px',
                  },
                }}
                {...params}
                label="Search for a concept"
                variant="outlined"
                size="small"
              />
            )}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                {!disableLinkOpen ? (
                  <Link
                    to={linkPath(option.conceptId as string)}
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
            )}
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
                      null,
                      toggleChange
                        ? ProductType.device
                        : ProductType.medication,
                    );
                }
              }}
            >
              <span style={{ fontSize: 'small' }}>
                {deviceToggle ? ProductType.device : ProductType.medication}{' '}
              </span>
            </IconButton>
          ) : (
            <div></div>
          )}
          <Button
            variant={'text'}
            color="primary"
            sx={{ width: '150px' }}
            aria-label="toggle-task-menu"
            onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
          >
            Advanced Search
          </Button>
        </Stack>
      </Grid>
      <GenericSidebar
        open={advancedSearchOpen}
        toggle={setAdvancedSearchOpen}
        title={'Advanced Search'}
      />
    </>
  );
}
const optionComponent = (
  option: Concept,
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
        <span>{option.conceptId}</span>
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
const getTermDisplay = (concept: Concept, fsnToggle: boolean): string => {
  return fsnToggle
    ? (concept.fsn?.term as string)
    : (concept.pt?.term as string);
};
