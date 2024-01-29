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

import { ReactNode, useState } from 'react';

import { Ticket, TicketProductDto } from '../../../types/tickets/ticket.ts';
import { Concept } from '../../../types/concept.ts';
import { ValidationColor } from '../../../types/validationColor.ts';
import statusToColor from '../../../utils/statusToColor.ts';

import { AddCircle, Delete } from '@mui/icons-material';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';
import useTicketStore from '../../../stores/TicketStore.ts';

import { Stack } from '@mui/system';
import { useNavigate } from 'react-router';
import useCanEditTask from '../../../hooks/useCanEditTask.tsx';
import UnableToEditTooltip from '../../tasks/components/UnableToEditTooltip.tsx';
import TicketProductService from '../../../api/TicketProductService.ts';
import {
  ProductStatus,
  ProductTableRow,
} from '../../../types/TicketProduct.ts';
import { filterProductRowById } from '../../../utils/helpers/ticketProductsUtils.ts';

interface TicketProductsProps {
  ticket: Ticket;
}

function mapToProductDetailsArray(
  productArray: TicketProductDto[],
): ProductTableRow[] {
  const productDetailsArray = productArray.map(function (item) {
    const productDto: ProductTableRow = {
      id: item.id as number,
      idToDelete: item.id as number,
      name: item.name,
      conceptId: item.conceptId,
      concept: item.packageDetails.productName
        ? item.packageDetails.productName
        : undefined,
      status:
        item.conceptId && item.conceptId !== null
          ? ProductStatus.Completed
          : ProductStatus.Partial,
      ticketId: item.ticketId,
      version: item.version as number,
    };
    return productDto;
  });
  return productDetailsArray;
}

function TicketProducts({ ticket }: TicketProductsProps) {
  const { products } = ticket;
  const [disabled, setDisabled] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | undefined>(undefined);
  const [deleteModalContent, setDeleteModalContent] = useState('');
  const productDetails = products ? mapToProductDetailsArray(products) : [];
  const { mergeTickets } = useTicketStore();
  const navigate = useNavigate();
  const [canEdit] = useCanEditTask();

  const handleDeleteProduct = () => {
    if (!idToDelete) {
      return;
    }
    const filteredProduct = filterProductRowById(idToDelete, productDetails);
    if (filteredProduct) {
      TicketProductService.deleteTicketProduct(
        filteredProduct.ticketId,
        filteredProduct.name,
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

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'Product Name',
      minWidth: 90,
      flex: 1,
      maxWidth: 150,
      type: 'singleSelect',
      sortable: false,

      renderCell: (
        params: GridRenderCellParams<GridValidRowModel, number>,
      ): ReactNode => {
        const filteredProduct = filterProductRowById(
          params.value as number,
          productDetails,
        );
        if (filteredProduct) {
          return (
            <Tooltip
              title={filteredProduct.name}
              key={`tooltip-${filteredProduct?.id}`}
            >
              {filteredProduct.status === ProductStatus.Completed ? (
                <Link
                  to={`product/view/${filteredProduct?.conceptId}`}
                  className={'product-view-link'}
                  key={`link-${filteredProduct?.id}`}
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {filteredProduct.name}
                </Link>
              ) : (
                <Link
                  to="product/edit"
                  state={{ productName: filteredProduct?.name }}
                  className={'product-edit-link'}
                  key={`link-${filteredProduct?.name}`}
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {filteredProduct.name}
                </Link>
              )}
            </Tooltip>
          );
        }
      },
      sortComparator: (v1: Concept, v2: Concept) =>
        v1.pt && v2.pt ? v1.pt.term.localeCompare(v2.pt.term) : -1,
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
      field: 'idToDelete',
      headerName: 'Actions',
      description: 'Actions',
      sortable: false,
      width: 100,
      type: 'singleSelect',
      renderCell: (
        params: GridRenderCellParams<GridValidRowModel, number>,
      ): ReactNode => {
        const filteredProduct = filterProductRowById(
          params.value as number,
          productDetails,
        );

        return (
          <IconButton
            aria-label="delete"
            size="small"
            disabled={filteredProduct?.status === ProductStatus.Completed}
            onClick={e => {
              setIdToDelete(filteredProduct?.id);

              setDeleteModalContent(
                `You are about to permanently remove the history of the product authoring information for [${filteredProduct?.concept?.pt?.term}] from the ticket.  This information cannot be recovered.`,
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
            <UnableToEditTooltip canEdit={canEdit}>
              <IconButton
                aria-label="create"
                size="large"
                disabled={!canEdit}
                onClick={() => {
                  navigate('product');
                }}
              >
                <Tooltip title={'Create new product'}>
                  <AddCircle fontSize="medium" />
                </Tooltip>
              </IconButton>
            </UnableToEditTooltip>
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
                getRowId={(row: ProductTableRow) => row.id}
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
