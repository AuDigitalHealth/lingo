import {
  DevicePackageDetails,
  MedicationPackageDetails,
} from '../../../types/product.ts';
import {
  Ticket,
  AutocompleteGroupOption,
  AutocompleteGroupOptionType,
} from '../../../types/tickets/ticket.ts';
import React, { useCallback, useState } from 'react';
import useUserStore from '../../../stores/UserStore.ts';
import useTicketStore from '../../../stores/TicketStore.ts';
import { useServiceStatus } from '../../../hooks/api/useServiceStatus.tsx';
import {
  filterAndMapToPartialProductNames,
  generateSuggestedProductName,
  generateSuggestedProductNameForDevice,
  mapToProductOptions,
  mapToTicketProductDto,
} from '../../../utils/helpers/ticketProductsUtils.ts';
import TicketProductService from '../../../api/TicketProductService.ts';
import { snowstormErrorHandler } from '../../../types/ErrorHandler.ts';
import Loading from '../../../components/Loading.tsx';
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  TextField,
} from '@mui/material';
import { Stack } from '@mui/system';
import { useNavigate } from 'react-router';
import { useTheme } from '@mui/material/styles';
import useAuthoringStore from '../../../stores/AuthoringStore.ts';
import { isDeviceType } from '../../../utils/helpers/conceptUtils.ts';
import { ProductStatus } from '../../../types/TicketProduct.ts';

interface ProductPartialSaveProps {
  packageDetails: MedicationPackageDetails | DevicePackageDetails;
  handleClose: () => void;
  ticket: Ticket;
  existingProductName?: string;
  productStatus?: string | undefined;
}
function ProductPartialSave({
  packageDetails,
  handleClose,
  ticket,
  existingProductName,
  productStatus,
}: ProductPartialSaveProps) {
  // alert(productStatus)
  const [isLoadingSave, setLoadingSave] = useState(false);
  const { login } = useUserStore();
  const { mergeTickets } = useTicketStore();
  const { serviceStatus } = useServiceStatus();
  const { setForceNavigation, selectedProductType } = useAuthoringStore();
  const suggestedProductName = isDeviceType(selectedProductType)
    ? generateSuggestedProductNameForDevice(
        packageDetails as DevicePackageDetails,
      )
    : generateSuggestedProductName(packageDetails as MedicationPackageDetails);
  const [productName, setProductName] =
    useState<AutocompleteGroupOption | null>(
      existingProductName && productStatus === ProductStatus.Partial
        ? {
            name: existingProductName,
            group: AutocompleteGroupOptionType.Existing,
          }
        : {
            name: suggestedProductName,
            group: AutocompleteGroupOptionType.New,
          },
    );
  const existingProductNames = filterAndMapToPartialProductNames(
    ticket.products,
  );
  const navigate = useNavigate();
  const theme = useTheme();
  const onChange = useCallback(
    (e: any, newValue: string | AutocompleteGroupOption | null) => {
      if (typeof newValue === 'string') {
        const option: AutocompleteGroupOption = {
          name: newValue,
          group: AutocompleteGroupOptionType.New,
        };
        setProductName(option);
      } else {
        setProductName(newValue);
      }
    },
    [setProductName],
  );
  const isValidProductName = () => {
    if (!productName) {
      return false;
    }
    if (productName.name.trim().length < 3) {
      return false;
    }
    if (
      existingProductName === productName.name &&
      productStatus === ProductStatus.Completed
    ) {
      return false;
    }
    return true;
  };
  const partialSave = () => {
    setLoadingSave(true);
    const ticketProductDto = mapToTicketProductDto(
      packageDetails,
      ticket,
      login as string,
      productName?.name as string,
      !existingProductNames.includes(productName?.name as string) ||
        productStatus === ProductStatus.Completed,
    );
    TicketProductService.draftTicketProduct(ticket.id, ticketProductDto)
      .then(() => {
        setForceNavigation(true);
        void TicketProductService.getTicketProducts(ticket.id).then(p => {
          ticket.products = p;
          mergeTickets(ticket);
          navigate('../');
        });
      })
      .catch(err => {
        setForceNavigation(false);
        snowstormErrorHandler(
          err,
          `Failed to save the product ${ticketProductDto.name}`,
          serviceStatus,
        );
      })
      .finally(() => {
        setLoadingSave(false);
        handleClose();
      });
  };
  if (isLoadingSave) {
    return <Loading message={`Loading Product save progress `} />;
  }
  return (
    <FormControl>
      <form onSubmit={partialSave}>
        <Autocomplete
          autoSelect={true}
          fullWidth
          freeSolo
          groupBy={option => option.group}
          getOptionLabel={option => {
            if (typeof option === 'string') {
              return option;
            } else {
              return option.name;
            }
          }}
          value={productName}
          onChange={onChange}
          options={mapToProductOptions(
            existingProductNames,
            suggestedProductName,
          )}
          sx={{ width: 300 }}
          renderInput={params => (
            <TextField
              {...params}
              label={'Select or enter a new product name'}
            />
          )}
        />
        <Box m={1} p={1}>
          {productName && existingProductNames.includes(productName.name) ? (
            <Box style={{ paddingBottom: '0.5rem' }}>
              <span style={{ color: `${theme.palette.warning.darker}` }}>
                Warning!: This will override the existing data{' '}
              </span>
            </Box>
          ) : (
            <div />
          )}

          {productName &&
          existingProductName === productName.name &&
          productStatus === ProductStatus.Completed ? (
            <Box style={{ paddingBottom: '0.5rem' }}>
              <span style={{ color: `${theme.palette.error.darker}` }}>
                Error!: Invalid product name{' '}
              </span>
            </Box>
          ) : (
            <div />
          )}

          <Stack spacing={2} direction="row" justifyContent="end">
            <Button
              variant="contained"
              type="button"
              color="error"
              onClick={handleClose}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              type="submit"
              color="primary"
              disabled={!isValidProductName()}
              data-testid={'partial-save-confirm-btn'}
            >
              Save
            </Button>
          </Stack>
        </Box>
      </form>
    </FormControl>
  );
}

export default ProductPartialSave;
