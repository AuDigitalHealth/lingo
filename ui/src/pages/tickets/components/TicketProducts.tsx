import React, { useCallback, useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';

import { Column } from 'primereact/column';
import {
  ProductStatus,
  ProductTableRow,
} from '../../../types/TicketProduct.ts';
import { Link, useNavigate } from 'react-router-dom';
import { ActionType, ProductType } from '../../../types/product.ts';
import {
  Grid,
  IconButton,
  InputLabel,
  Tooltip,
  Typography,
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { AddCircle, Delete } from '@mui/icons-material';
import UnableToEditTooltip from '../../tasks/components/UnableToEditTooltip.tsx';
import { Ticket } from '../../../types/tickets/ticket.ts';
import { useCanEditTicket } from '../../../hooks/api/tickets/useCanEditTicket.tsx';
import {
  filterProductRowById,
  mapToProductDetailsArray,
  mapToProductDetailsArrayFromBulkActions,
} from '../../../utils/helpers/ticketProductsUtils.ts';
import useCanEditTask from '../../../hooks/useCanEditTask.tsx';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';
import { Stack } from '@mui/system';
import TicketProductService from '../../../api/TicketProductService.ts';
import './TicketProducts.css';
import { useSearchConceptByIds } from '../../../hooks/api/products/useSearchConcept.tsx';
import Loading from '../../../components/Loading.tsx';
import { isDeviceType } from '../../../utils/helpers/conceptUtils.ts';
import { getTicketProductsByTicketIdOptions } from '../../../hooks/api/tickets/useTicketById.tsx';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveConceptIdsByIds } from '../../../hooks/eclRefset/useConceptsById.tsx';
import WarningIcon from '@mui/icons-material/Warning';

interface TicketProductsProps {
  ticket: Ticket;
  branch: string;
}

interface RowToExpand {
  [p: number]: boolean;
}

function TicketProducts({ ticket, branch }: TicketProductsProps) {
  const { canEdit: canEditTicket, lockDescription: ticketLockDescription } =
    useCanEditTicket(ticket);
  const { products, bulkProductActions } = ticket;
  const [disabled, setDisabled] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | undefined>(undefined);
  const [deleteModalContent, setDeleteModalContent] = useState('');
  const productDetailsArray = useMemo(
    () => (products ? mapToProductDetailsArray(products, 0) : []),
    [products],
  );

  const bulkProductActionDetailsArray = useMemo(
    () =>
      bulkProductActions
        ? mapToProductDetailsArrayFromBulkActions(
            bulkProductActions,
            productDetailsArray.length,
          )
        : [],
    [bulkProductActions, productDetailsArray.length],
  );

  const data = useMemo(
    () => [...productDetailsArray, ...bulkProductActionDetailsArray],
    [productDetailsArray, bulkProductActionDetailsArray],
  );

  const navigate = useNavigate();
  const { canEdit, lockDescription } = useCanEditTask();
  const queryClient = useQueryClient();

  const [expandedRows, setExpandedRows] = useState<ProductTableRow[]>([]);

  const [expandedRowIds, setExpandedRowIds] = useState<number[]>([]);

  // Extract all concept IDs from data
  const conceptIds = useMemo(() => {
    return Array.from(
      new Set(data.flatMap(row => (row.conceptId ? [row.conceptId] : []))),
    );
  }, [data]); // This dependency is now properly memoized

  // Use the hook with memoized conceptIds
  const { activeConceptIds, activeConceptsLoading } = useActiveConceptIdsByIds(
    branch,
    conceptIds,
  );

  // Create a memoized version of data that includes the active status
  const enrichedData = useMemo(() => {
    if (!activeConceptIds) return data;

    return data.map(row => ({
      ...row,
      isActive: row.conceptId
        ? activeConceptIds.items?.includes(row.conceptId)
        : false,
    }));
  }, [data, activeConceptIds]);

  const handleDeleteProduct = () => {
    if (idToDelete === undefined) {
      return;
    }
    const filteredProduct = filterProductRowById(idToDelete, data);
    if (filteredProduct) {
      TicketProductService.deleteTicketProduct(ticket.id, filteredProduct.name)
        .then(() => {
          void queryClient.invalidateQueries({
            queryKey: getTicketProductsByTicketIdOptions(ticket.id.toString())
              .queryKey,
          });
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

  const rowExpansionTemplate = (data: ProductTableRow) => {
    if (isBulkPackProductAction(data)) {
      return <BulkActionChildConcepts bulkActionData={data} branch={branch} />;
    } else {
      return null;
    }
  };

  const actionBodyTemplate = (rowData: ProductTableRow) => {
    if (!isBulkPackProductAction(rowData)) {
      if (showActionLoadInToAtomicForm(rowData)) {
        return (
          <IconButton aria-label="delete" size="small">
            <Tooltip
              title={'Load in to atomic screen'}
              key={`tooltip-${rowData?.productId}`}
            >
              <Link
                to="product/edit"
                state={{
                  productId: rowData?.productId,
                  productName: rowData?.name,
                  productType: rowData?.productType,
                  actionType: isDeviceType(rowData.productType as ProductType)
                    ? ActionType.newDevice
                    : ActionType.newMedication,
                }}
                className={'product-edit-link'}
                key={`link-${rowData?.name}`}
                data-testid={`link-${rowData?.name}`}
                style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                <FileUploadIcon></FileUploadIcon>
              </Link>
            </Tooltip>
          </IconButton>
        );
      } else if (isPartialProduct(rowData)) {
        return (
          <UnableToEditTooltip
            canEdit={canEditTicket && canEdit}
            lockDescription={
              !canEditTicket ? ticketLockDescription : lockDescription
            }
          >
            <IconButton
              aria-label="delete"
              size="small"
              onClick={e => {
                setIdToDelete(rowData?.id);

                setDeleteModalContent(
                  `You are about to permanently remove the history of the product authoring information for [${rowData?.concept?.pt?.term}] from the ticket.  This information cannot be recovered.`,
                );
                setDeleteModalOpen(true);
                e.stopPropagation();
              }}
              color="error"
              sx={{ mt: 0.25 }}
            >
              <Tooltip title={'Delete Product'}>
                <Delete data-testid={`delete-${rowData?.name}`} />
              </Tooltip>
            </IconButton>
          </UnableToEditTooltip>
        );
      }
    } else return <></>;
  };

  const manuallyTriggerRowToggle = (rowData: ProductTableRow) => {
    let newExpandedRowIds = expandedRowIds;
    if (expandedRowIds.includes(rowData.id)) {
      newExpandedRowIds = expandedRowIds.filter(row => row !== rowData.id);
    } else if (isBulkPackProductAction(rowData)) {
      newExpandedRowIds.push(rowData.id);
    }
    setExpandedRowIds(newExpandedRowIds);
    const newExpandedRows = newExpandedRowIds.reduce((p: RowToExpand, id) => {
      p[id] = true;
      return p;
    }, {});
    const event = { originalEvent: null, data: newExpandedRows };
    onRowToggle(event);
  };

  // eslint-disable-next-line
  const onRowToggle = (e: any) => {
    setExpandedRows(e.data as ProductTableRow[]);
  };

  // Memoized product name template function
  const productNameTemplateWithActiveStatus = useCallback(
    (rowData: ProductTableRow) => {
      const activeIds = activeConceptIds ? activeConceptIds.items : [];

      if (isProductUpdate(rowData)) {
        return (
          <Tooltip title={rowData.name} key={`tooltip-${rowData.id}`}>
            <Link
              to={`product/view/update/${rowData.bulkProductActionId}`}
              className={'product-view-update-link'}
              key={`link-${rowData.id}`}
              data-testid={`link-${rowData.id}`}
              style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {trimName(rowData.name)}
            </Link>
          </Tooltip>
        );
      }
      if (isBulkPackProductAction(rowData)) {
        return (
          <Tooltip title={rowData.name} key={`tooltip-${rowData.id}`}>
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>
              {rowData.name}
            </span>
          </Tooltip>
        );
      } else if (isPartialProduct(rowData)) {
        return (
          <Tooltip title={rowData.name} key={`tooltip-${rowData.id}`}>
            <Link
              to="product/edit"
              state={{
                productId: rowData?.productId,
                productName: rowData?.name,
                productType: rowData?.productType,
                actionType: isDeviceType(rowData.productType as ProductType)
                  ? ActionType.newDevice
                  : ActionType.newMedication,
              }}
              className={'product-edit-link'}
              key={`link-${rowData?.name}`}
              data-testid={`link-${rowData?.name}`}
              style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {trimName(rowData.name)}
            </Link>
          </Tooltip>
        );
      } else if (rowData.conceptId && activeIds.includes(rowData.conceptId)) {
        return (
          <Tooltip title={rowData.name} key={`tooltip-${rowData.id}`}>
            <Link
              to={`product/view/${rowData.conceptId}`}
              className={'product-view-link'}
              key={`link-${rowData.id}`}
              data-testid={`link-${rowData.id}`}
              style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {trimName(rowData.name)}
            </Link>
          </Tooltip>
        );
      } else {
        return (
          <Tooltip
            title={'Product no longer exists or is inactive.'}
            key={`tooltip-${rowData.id}`}
          >
            <div>
              <WarningIcon color="warning" />
              <Typography>{trimName(rowData.name)}</Typography>
            </div>
          </Tooltip>
        );
      }
    },
    [activeConceptIds], // This ensures the function is recreated when activeConceptIds changes
  );

  // Show a loading indicator if we're still loading active concept IDs
  if (activeConceptsLoading) {
    return <Loading message={'Loading Products...'} />;
  }

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
            <UnableToEditTooltip
              canEdit={canEditTicket && canEdit}
              lockDescription={
                !canEditTicket ? ticketLockDescription : lockDescription
              }
            >
              <IconButton
                data-testid={'create-new-product'}
                aria-label="create"
                size="large"
                disabled={!(canEditTicket && canEdit)}
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
          <div
            className="custom-datatable"
            style={{ display: 'flex', justifyContent: 'flex-start' }}
          >
            <DataTable
              paginator
              rows={5}
              rowsPerPageOptions={[5, 10, 25, 50]}
              tableStyle={{
                minHeight: '100%',
                maxHeight: '100%',
              }}
              size="small"
              sortField={'created'}
              sortOrder={-1}
              value={enrichedData}
              expandedRows={expandedRows}
              onRowClick={e => {
                manuallyTriggerRowToggle(e.data as ProductTableRow);
              }}
              onRowToggle={onRowToggle}
              rowExpansionTemplate={rowExpansionTemplate}
              dataKey="id"
              rowClassName={rowClassName}
            >
              <Column
                field="name"
                body={productNameTemplateWithActiveStatus}
                header="Product Name"
                style={{
                  maxWidth: '125px',
                  overflow: 'hidden',
                  maxHeight: '18px',
                  textOverflow: 'ellipsis',
                }}
              />
              <Column
                field="actionProductType"
                header="Action"
                body={(rowData: ProductTableRow) => {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div>{rowData.productType || ''}</div>
                      <div>
                        {rowData.action ? rowData.action.toLowerCase() : ''}
                      </div>
                    </div>
                  );
                }}
                style={{
                  maxWidth: '3.5em',
                  overflow: 'hidden',
                  maxHeight: '18px',
                  textOverflow: 'ellipsis',
                }}
              />
              <Column
                field="created"
                header="Created"
                body={(rowData: ProductTableRow) => {
                  const date = new Date(rowData.created);
                  return date.toISOString().split('T')[0];
                }}
                style={{
                  maxWidth: '3em',
                  overflow: 'hidden',
                  maxHeight: '18px',
                  textOverflow: 'ellipsis',
                }}
              />
              <Column
                header=""
                body={actionBodyTemplate}
                style={{ textAlign: 'center', width: '1em' }}
              />
            </DataTable>
          </div>
        </Grid>
      </Stack>
    </>
  );
}

// Keep these helper functions outside the component
const trimName = (name: string) => {
  const maxChars = 50;
  if (name.length <= maxChars) {
    return name;
  }
  return `${name.substring(0, maxChars)}...`;
};

const isBulkPackProductAction = (
  product: ProductTableRow | undefined,
): boolean => {
  if (
    (product && product.productType === ProductType.brandPackSize) ||
    product?.productType === ProductType.bulkPackSize ||
    product?.productType === ProductType.bulkBrand ||
    product?.productType === ProductType.productUpdate
  ) {
    return true;
  }
  return false;
};

const isProductUpdate = (product: ProductTableRow | undefined): boolean => {
  if (product && product.productType === ProductType.productUpdate) {
    return true;
  }
  return false;
};

const showActionLoadInToAtomicForm = (product: ProductTableRow | undefined) => {
  if (!product) {
    return false;
  }
  return (
    product &&
    product?.status === ProductStatus.Completed &&
    !isBulkPackProductAction(product)
  );
};

const isPartialProduct = (product: ProductTableRow | undefined) => {
  if (!product) {
    return false;
  }
  return product && product?.status === ProductStatus.Partial;
};

const rowClassName = (rowData: ProductTableRow) => {
  return {
    'custom-row': false,
    'completed-row': rowData.status === ProductStatus.Completed,
    'partial-row': rowData.status === ProductStatus.Partial,
  };
};

interface BulkActionChildConceptsProps {
  bulkActionData: ProductTableRow;
  branch: string;
}

function BulkActionChildConcepts({
  bulkActionData,
  branch,
}: BulkActionChildConceptsProps) {
  const { conceptData, isConceptLoading } = useSearchConceptByIds(
    bulkActionData.conceptIds,
    branch,
  );

  if (isConceptLoading) {
    return <Loading message={'Loading'}></Loading>;
  }

  return (
    <div className="completed-row">
      <h5>Updated Products</h5>
      <ul>
        {conceptData.map((concept, index) => (
          <li key={index}>
            <Tooltip title={concept.pt?.term} key={`tooltip-${concept.id}`}>
              <Link
                to={`product/view/${concept.conceptId}`}
                className={'product-view-link'}
                key={`link-${index}`}
                data-testid={`link-${index}`}
                style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {concept.pt?.term}
              </Link>
            </Tooltip>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TicketProducts;
