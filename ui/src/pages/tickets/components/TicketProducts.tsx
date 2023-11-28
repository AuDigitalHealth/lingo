import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridValidRowModel,
} from '@mui/x-data-grid';

import {
  Card,
  Chip,
  Grid,
  IconButton,
  InputLabel,
  Tooltip,
} from '@mui/material';
import { Link } from 'react-router-dom';

import React, { ReactNode, useState } from 'react';

import { Ticket, TicketProductDto } from '../../../types/tickets/ticket.ts';
import { Concept } from '../../../types/concept.ts';
import { ValidationColor } from '../../../types/validationColor.ts';
import statusToColor from '../../../utils/statusToColor.ts';

import { AddCircle, Delete } from '@mui/icons-material';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';
import TicketsService from '../../../api/TicketsService.ts';
import useTicketStore from '../../../stores/TicketStore.ts';

import { Stack } from '@mui/system';
import { useNavigate } from 'react-router';

interface TicketProductsProps {
  ticket: Ticket;
}
interface ProductDto {
  id: number;
  conceptId: string;
  ctppId: string;
  concept: Concept | undefined;
  status: string;
  ticketId: number;
}

enum ProductStatus {
  Completed = 'completed',
  Partial = 'partial',
}

function mapToProductDetailsArray(
  productArray: TicketProductDto[],
): ProductDto[] {
  const productDetailsArray = productArray.map(function (item) {
    const productDto: ProductDto = {
      id: item.id,
      conceptId: item.conceptId,
      ctppId: item.conceptId,
      concept: item.packageDetails.productName
        ? item.packageDetails.productName
        : undefined,
      status:
        item.conceptId && item.conceptId !== null ? 'completed' : 'partial',
      ticketId: item.ticketId,
    };
    return productDto;
  });
  return productDetailsArray;
}

function TicketProducts({ ticket }: TicketProductsProps) {
  const { products } = ticket;
  const [disabled, setDisabled] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | undefined>(undefined);
  const [deleteModalContent, setDeleteModalContent] = useState('');
  const productDetails = products ? mapToProductDetailsArray(products) : [];
  const { mergeTickets } = useTicketStore();
  const navigate = useNavigate();
  const handleDeleteProduct = () => {
    if (!idToDelete) {
      return;
    }
    const filteredProduct = filterProduct(idToDelete);
    if (filteredProduct) {
      TicketsService.deleteTicketProduct(
        filteredProduct.ticketId,
        Number(filteredProduct.conceptId),
      )
        .then(() => {
          ticket.products = ticket.products?.filter(product => {
            return product.id !== filteredProduct.id;
          });
          mergeTickets(ticket);
          setDisabled(false);
          if (window.location.href.includes('/product')) {
            let url = window.location.href;
            url = url.substring(
              url.indexOf('/dashboard'),
              url.indexOf('/product'),
            );

            navigate(url + '/product');
          }
        })
        .catch(() => {
          setDisabled(false);
        });
    }

    setDeleteModalOpen(false);
  };
  function filterProduct(conceptId: string): ProductDto | undefined {
    const filteredProduct = productDetails.find(function (product) {
      return product.conceptId === conceptId;
    });
    return filteredProduct;
  }
  const columns: GridColDef[] = [
    {
      field: 'ctppId',
      headerName: 'Product Name',
      minWidth: 90,
      flex: 1,
      maxWidth: 150,
      type: 'singleSelect',
      sortable: false,

      renderCell: (
        params: GridRenderCellParams<GridValidRowModel, string>,
      ): ReactNode => {
        const filteredProduct = filterProduct(params.value as string);
        return (
          <Tooltip
            title={filteredProduct?.concept?.pt.term}
            key={`tooltip-${filteredProduct?.id}`}
          >
            <Link
              to={`product/${filteredProduct?.conceptId}`}
              className={'product-view-link'}
              key={`link-${filteredProduct?.id}`}
              style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {filteredProduct?.concept?.pt.term}
            </Link>
          </Tooltip>
        );
      },
      sortComparator: (v1: Concept, v2: Concept) =>
        v1.pt.term.localeCompare(v2.pt.term),
    },
    {
      field: 'status',
      headerName: 'Status',
      description: 'Status',
      minWidth: 90,
      flex: 1,
      maxWidth: 120,
      type: 'singleSelect',
      sortable: false,
      valueOptions: Object.values(ProductStatus),
      renderCell: (
        params: GridRenderCellParams<GridValidRowModel, string>,
      ): ReactNode => <ValidationBadge params={params.formattedValue} />,
    },
    {
      field: 'conceptId',
      headerName: 'Actions',
      description: 'Actions',
      sortable: false,
      width: 100,
      type: 'singleSelect',
      renderCell: (
        params: GridRenderCellParams<GridValidRowModel, string>,
      ): ReactNode => {
        const filteredProduct = filterProduct(params.value as string);

        return (
          <IconButton
            aria-label="delete"
            size="small"
            onClick={e => {
              setIdToDelete(filteredProduct?.conceptId);

              setDeleteModalContent(
                `You are about to permanently remove the history of the product authoring information for [${filteredProduct?.concept?.pt.term}] from the ticket.  This information cannot be recovered.`,
              );
              setDeleteModalOpen(true);
              e.stopPropagation();
            }}
            color="error"
            sx={{ mt: 0.25 }}
          >
            <Tooltip title={'Delete Product'}>
              <Delete />
            </Tooltip>
          </IconButton>
        );
      },
    },
  ];
  return (
    <>
      <ConfirmationModal
        open={deleteModalOpen}
        content={deleteModalContent}
        handleClose={() => {
          setDeleteModalOpen(false);
        }}
        title={'Confirm Delete Product'}
        disabled={disabled}
        action={'Remove Product Data'}
        handleAction={handleDeleteProduct}
        reverseAction={'Cancel'}
      />
      <Stack direction="column" width="100%" marginTop="0.5em">
        <Stack direction="row" spacing={2} alignItems="center">
          <Grid item xs={10}>
            <InputLabel sx={{ mt: 0.5 }}>Products:</InputLabel>
          </Grid>
          <Grid container justifyContent="flex-end">
            <Link to="product">
              <IconButton aria-label="create" size="large">
                <Tooltip title={'Create new product'}>
                  <AddCircle fontSize="medium" />
                </Tooltip>
              </IconButton>
            </Link>
          </Grid>
        </Stack>

        <Grid container sx={{ marginTop: 'auto' }}>
          <Grid item xs={12} lg={12}>
            <Card sx={{ width: '100%' }}>
              <DataGrid
                sx={{
                  fontWeight: 400,
                  fontSize: 13,
                  borderRadius: 0,
                  border: 0,
                  color: '#003665',
                  '& .MuiDataGrid-row': {
                    borderBottom: 0.5,
                    borderColor: 'rgb(240, 240, 240)',
                    minHeight: 'auto !important',
                    maxHeight: 'none !important',
                    // paddingLeft: '2px',
                    // paddingRight: '2px',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    border: 0,
                    borderTop: 0,
                    borderBottom: 0.5,
                    borderColor: 'rgb(240, 240, 240)',
                    borderRadius: 0,
                    backgroundColor: 'rgb(250, 250, 250)',
                    // paddingLeft: '2px',
                    // paddingRight: '2px',
                  },
                  '& .MuiDataGrid-footerContainer': {
                    border: 0,
                  },
                  '& .MuiTablePagination-selectLabel': {
                    color: 'rgba(0, 54, 101, 0.6)',
                  },
                  '& .MuiSelect-select': {
                    color: '#003665',
                  },
                  '& .MuiTablePagination-displayedRows': {
                    color: '#003665',
                  },
                  '& .MuiSvgIcon-root': {
                    // color: '#003665',
                  },
                }}
                getRowId={(row: ProductDto) => row.id}
                rows={productDetails}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 5,
                    },
                  },
                  sorting: {
                    sortModel: [{ field: 'concept', sort: 'asc' }],
                  },
                }}
                pageSizeOptions={[5]}
                disableRowSelectionOnClick
                disableColumnSelector={true}
                disableColumnMenu={true}
              />
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </>
  );
}
function ValidationBadge(formattedValue: { params: string | undefined }) {
  if (formattedValue.params === undefined || formattedValue.params === '') {
    return <></>;
  }
  const message = formattedValue.params;
  const type: ValidationColor = statusToColor(message);

  return (
    <>
      <Chip color={type} label={message} size="small" sx={{ color: 'black' }} />
    </>
  );
}
export default TicketProducts;
