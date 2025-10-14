import {
  Button,
  IconButton,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Grid } from '@mui/material';

import React, { useState } from 'react';
import { ProductTableRow } from '../../../types/TicketProduct.ts';
import BaseModal from '../../../components/modal/BaseModal.tsx';
import BaseModalHeader from '../../../components/modal/BaseModalHeader.tsx';
import BaseModalBody from '../../../components/modal/BaseModalBody.tsx';
import BaseModalFooter from '../../../components/modal/BaseModalFooter.tsx';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useTicketProductAuditQuery } from '../../products/rjsf/hooks/useTicketProductQuery.ts';
import {
  Ticket,
  TicketProductAuditDto,
} from '../../../types/tickets/ticket.ts';
import { Link } from 'react-router-dom';
import { isDeviceType } from '../../../utils/helpers/conceptUtils.ts';
import { ActionType, ProductType } from '../../../types/product.ts';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { findProductType } from '../../../utils/helpers/ticketProductsUtils.ts';
import { useJiraUsers } from '../../../hooks/api/useInitializeJiraUsers.tsx';
import Loading from '../../../components/Loading.tsx';
import AvatarWithTooltip from '../../../components/AvatarWithTooltip.tsx';

interface ProductAuditModalProps {
  open: boolean;
  handleClose: () => void;
  keepMounted?: boolean;
  ticket: Ticket;
  ticketProductId: string;
}

export default function ProductAuditModal({
  open,
  handleClose,
  keepMounted = false,
  ticket,
  ticketProductId,
}: ProductAuditModalProps) {
  const [expandedRows, setExpandedRows] = useState<TicketProductAuditDto[]>([]);
  const [auditRecords, setAuditRecords] = useState([]);
  const { isLoading, isFetching } = useTicketProductAuditQuery({
    ticketProductId,
    ticket,
    setFunction: (data: TicketProductAuditDto[] | undefined | null) => {
      setAuditRecords(data);
    },
  });
  const { jiraUsers } = useJiraUsers();

  // eslint-disable-next-line
  const onRowToggle = (e: any) => {
    setExpandedRows(e.data);
  };

  const actionBodyTemplate = (rowData: TicketProductAuditDto) => (
    <IconButton aria-label="delete" size="small">
      <Tooltip
        title={'Load in to atomic screen'}
        key={`tooltip-${rowData?.revisionNumber}`}
      >
        <Link
          to="product/edit"
          state={{
            productId: rowData?.id,
            productName: rowData?.name,
            productType: findProductType(rowData.packageDetails),
            actionType: isDeviceType(findProductType(rowData.packageDetails))
              ? ActionType.newDevice
              : ActionType.newMedication,
            productAuditDto: rowData,
          }}
          className={'product-edit-link'}
          key={`link-${rowData?.revisionNumber}`}
          data-testid={`link-${rowData?.name}`}
          style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          <FileUploadIcon></FileUploadIcon>
        </Link>
      </Tooltip>
    </IconButton>
  );

  const rowExpansionTemplate = (rowData: ProductTableRow) => (
    <div style={{ padding: '1rem' }}>
      <strong>Details:</strong> {rowData.name} ({rowData.id})
    </div>
  );
  if (isLoading) {
    return <Loading message={'Loading Products...'} />;
  }
  const fullName = getLatestAuditName(auditRecords);
  const truncatedName = fullName ? truncateTitle(fullName) : undefined;
  const isTruncated = fullName !== truncatedName;
  return (
    <BaseModal open={open} handleClose={handleClose} keepMounted={keepMounted}>
      <BaseModalHeader
        title={
          <Tooltip title={isTruncated ? fullName : ''}>
            <Typography component="span" variant="h6">
              Historical Records for{' '}
              <Typography
                component="span"
                sx={{
                  color: 'primary.main', // 👈 Change color here
                  fontWeight: 500,
                  textDecoration: isTruncated ? 'underline dotted' : 'none',
                  cursor: isTruncated ? 'help' : 'default',
                }}
              >
                {truncatedName}
              </Typography>
            </Typography>
          </Tooltip>
        }
      />

      <BaseModalBody sx={{ overflow: 'auto' }}>
        <Grid container sx={{ marginTop: 'auto' }}>
          <div
            className="custom-datatable"
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              width: '100%',
            }}
          >
            <DataTable
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25, 50]}
              tableStyle={{ minHeight: '100%', maxHeight: '100%' }}
              size="small"
              sortField="revisionNumber"
              sortOrder={-1}
              value={auditRecords}
              expandedRows={expandedRows}
              onRowToggle={onRowToggle}
              rowExpansionTemplate={rowExpansionTemplate}
              dataKey="revisionNumber"
            >
              <Column
                field="revisionNumber"
                header="Revision Number"
                sortable
                style={{
                  maxWidth: '125px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              />
              <Column
                field="action"
                header="Action"
                sortable
                style={{
                  maxWidth: '125px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              />
              <Column
                field="createdBy"
                header="Created By"
                body={(rowData: TicketProductAuditDto) => {
                  const user = jiraUsers?.find(
                    (u: { name?: string; key?: string }) =>
                      u.name === rowData.createdBy ||
                      u.key === rowData.createdBy,
                  );
                  return user ? (
                    <AvatarWithTooltip
                      username={user.name}
                      tooltip={user.displayName}
                    />
                  ) : (
                    (rowData.createdBy ?? '')
                  );
                }}
                style={{
                  maxWidth: '100px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'center',
                }}
              />

              <Column
                field="modifiedBy"
                header="Modified By"
                body={(rowData: TicketProductAuditDto) => {
                  const user = jiraUsers?.find(
                    (u: { name?: string; key?: string }) =>
                      u.name === rowData.modifiedBy ||
                      u.key === rowData.modifiedBy,
                  );
                  return user ? (
                    <AvatarWithTooltip
                      username={user.name}
                      tooltip={user.displayName}
                    />
                  ) : (
                    (rowData.modifiedBy ?? '')
                  );
                }}
                style={{
                  maxWidth: '100px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'center',
                }}
              />

              <Column
                field="created"
                header="Created"
                sortable
                style={{
                  maxWidth: '125px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              />
              <Column
                field="revisionDate"
                header="Modified"
                sortable
                style={{
                  maxWidth: '125px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              />
              <Column
                header=""
                body={(rowData: ProductTableRow) => (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    {actionBodyTemplate(rowData)}
                  </div>
                )}
                style={{ textAlign: 'center', width: '1em' }}
              />
            </DataTable>
          </div>
        </Grid>
      </BaseModalBody>

      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Button variant="contained" onClick={handleClose}>
            Close
          </Button>
        }
      />
    </BaseModal>
  );
}
function getLatestAuditName(
  auditRecords: TicketProductAuditDto[],
): string | undefined {
  if (!auditRecords?.length) return undefined;

  const latest = auditRecords.reduce(
    (latest, record) =>
      record.revisionNumber > (latest?.revisionNumber ?? -1) ? record : latest,
    undefined as TicketProductAuditDto | undefined,
  );

  return latest?.name ?? undefined;
}
function truncateTitle(title: string, maxLength = 60): string | undefined {
  if (!title) {
    return undefined;
  }
  const clean = title?.trim() ?? '';
  return clean.length > maxLength
    ? clean.slice(0, maxLength).trim() + '...'
    : clean;
}
