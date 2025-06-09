import {
  DataTable,
  DataTableExpandedRows,
  DataTableValueArray,
} from 'primereact/datatable';

import './jobs.css';
import {
  useJobResults,
  useUpdateJobResult,
} from '../../hooks/api/useJobResults';
import { Column, ColumnFilterElementTemplateOptions } from 'primereact/column';
import React, { useMemo, useState } from 'react';
import {
  JobResult,
  Result,
  ResultItem,
  ResultNotification,
  isJobResult,
  ResultNotificationType,
  hasNestedResults,
} from '../../types/tickets/jobs';
import { Button, Card, Tooltip, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { Dropdown } from 'primereact/dropdown';
import { CheckCircle, Error, Warning } from '@mui/icons-material';

export default function Jobs() {
  const jobs = useJobResults();

  const jobNames = useMemo(() => {
    return [...new Set(jobs.data?.map(job => job.jobName) || [])].map(name => ({
      jobName: name,
    }));
  }, [jobs.data]);

  console.log(jobNames.length);

  const [expandedRows, setExpandedRows] = useState<
    DataTableExpandedRows | DataTableValueArray | undefined
  >(undefined);

  const [nestedExpandedRows, setNestedExpandedRows] = useState<
    DataTableExpandedRows | DataTableValueArray | undefined
  >(undefined);

  const updateJobResult = useUpdateJobResult();

  const allowExpansion = (jobResult: JobResult) => {
    return jobResult.results.length > 0;
  };

  const allowNestedExpansion = (result: Result) => {
    if (result.results && result.results.length > 0) {
      return true;
    }

    if (result.items && result.items.length > 0) return true;

    return false;
  };

  const rowExpansionTemplate = (jobResult: JobResult | Result) => {
    const renderMessageColumn = (() => {
      if (isJobResult(jobResult) && hasNestedResults(jobResult)) {
        return false;
      }
      return true;
    })();

    const header = (() => {
      if (isJobResult(jobResult)) {
        return <h5>Results for {jobResult.jobName}</h5>;
      }
      return <></>;
    })();

    return (
      <div className="p-3">
        {header}
        <DataTable
          value={jobResult.results}
          expandedRows={nestedExpandedRows}
          onRowToggle={e => setNestedExpandedRows(e.data)}
          rowExpansionTemplate={nestedRowExpansionTemplate}
          dataKey="id"
          rowClassName={rowData => {
            if (nestedExpandedRows === undefined) return '';
            // If expandedRows is DataTableValueArray
            if (Array.isArray(nestedExpandedRows)) {
              return nestedExpandedRows.some(item => item === rowData)
                ? 'expanded-row'
                : '';
            }

            // If expandedRows is DataTableExpandedRows
            if (
              typeof nestedExpandedRows === 'object' &&
              !Array.isArray(nestedExpandedRows)
            ) {
              if (!rowData.id) return '';
              return nestedExpandedRows[rowData.id] ? 'expanded-row' : '';
            }

            return '';
          }}
        >
          <Column expander={allowNestedExpansion} style={{ width: '5rem' }} />
          <Column
            field="name"
            header="Name"
            sortable
            body={(rowData: Result) => {
              return <Typography>{rowData.name}</Typography>;
            }}
          ></Column>
          <Column
            field="count"
            header="Count"
            sortable
            body={(rowData: Result) => {
              return <Typography>{rowData.count}</Typography>;
            }}
          ></Column>
          <Column
            field="notification"
            header="Notification"
            body={NotificationTemplate}
          ></Column>
          {renderMessageColumn ? (
            <Column
              field="notification"
              header="Message"
              body={NotificationMessageTemplate}
            ></Column>
          ) : (
            <></>
          )}
        </DataTable>
      </div>
    );
  };

  const nestedRowExpansionTemplate = (result: Result) => {
    if (result.results) {
      return rowExpansionTemplate(result);
    }
    return (
      <div className="p-3">
        <h5>Results for {result.name}</h5>
        <DataTable
          value={result.items}
          expandedRows={nestedExpandedRows}
          onRowToggle={e => setNestedExpandedRows(e.data)}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
        >
          <Column field="id" header="Id" sortable></Column>
          <Column
            field="title"
            header="title"
            sortable
            body={ResultItemTitleTemplate}
          ></Column>
        </DataTable>
      </div>
    );
  };

  const AcknowledgedButtonTemplate = (rowData: JobResult) => {
    return (
      <>
        {rowData.acknowledged ? (
          <>
            <Button
              variant="outlined"
              sx={{ marginLeft: 'auto', fontWeight: 'bold', width: '150px' }}
              disabled={true}
            >
              Acknowledged
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="contained"
              color="success"
              sx={{ marginLeft: 'auto', fontWeight: 'bold', width: '150px' }}
              onClick={() => updateJobResult.mutate(rowData)}
              disabled={false}
            >
              Acknowledge
            </Button>
          </>
        )}
      </>
    );
  };

  const jobNameFilterTemplate = (
    options: ColumnFilterElementTemplateOptions,
  ) => {
    return (
      <Dropdown
        value={options.value}
        options={jobNames}
        onChange={e => options.filterCallback(e.value)}
        optionLabel="jobName"
        optionValue="jobName"
        placeholder="Any"
        className="p-column-filter"
      />
    );
  };

  return (
    <Card sx={{ overflowY: 'scroll' }}>
      <DataTable
        value={jobs.data}
        tableStyle={{ minWidth: '50rem' }}
        expandedRows={expandedRows}
        onRowToggle={e => setExpandedRows(e.data)}
        rowExpansionTemplate={rowExpansionTemplate}
        dataKey="id"
        sortField="finishedTime"
        sortOrder={-1}
        rowClassName={rowData => {
          if (expandedRows === undefined) return '';

          // If expandedRows is DataTableValueArray
          if (Array.isArray(expandedRows)) {
            return expandedRows.some(item => item === rowData)
              ? 'expanded-row'
              : '';
          }

          // If expandedRows is DataTableExpandedRows
          if (
            typeof expandedRows === 'object' &&
            !Array.isArray(expandedRows)
          ) {
            return expandedRows[rowData.id] ? 'expanded-row' : '';
          }

          return '';
        }}
      >
        <Column expander={allowExpansion} style={{ width: '5rem' }} />

        <Column
          field="jobName"
          header="Job Name"
          filter
          sortable
          showFilterMatchModes={false}
          showFilterMenuOptions={false}
          body={(rowData: JobResult) => {
            return <Typography>{rowData.jobName}</Typography>;
          }}
          filterElement={jobNameFilterTemplate}
          filterField="jobName"
        ></Column>
        <Column
          field="jobId"
          header="Job Id"
          body={(rowData: JobResult) => {
            return <Typography>{rowData.jobId}</Typography>;
          }}
        ></Column>
        <Column
          field="finishedTime"
          header="Finished Time"
          sortable
          dataType="date"
          filter
          filterField="finishedTime"
          body={FinishedTimeTemplate}
        ></Column>
        <Column
          sortable
          field="acknowledged"
          header="Acknowledged"
          body={AcknowledgedButtonTemplate}
        ></Column>
      </DataTable>
    </Card>
  );
}

const NotificationTemplate = (rowData: Result) => {
  return <>{mapToNotificationIcon(rowData.notification)}</>;
};

const mapToNotificationIcon = (
  notification: ResultNotification | undefined,
) => {
  if (!notification) return <></>;
  let icon = undefined;
  switch (notification.type) {
    case ResultNotificationType.ERROR:
      icon = <Error color="error" />;
      break;
    case ResultNotificationType.WARNING:
      icon = <Warning color="warning" />;
      break;
    case ResultNotificationType.SUCCESS:
      icon = <CheckCircle color="success" />;
      break;
    default:
      return <></>;
  }

  return <Tooltip title={notification.type}>{icon}</Tooltip>;
};
const NotificationMessageTemplate = (rowData: Result) => {
  if (!rowData.notification?.description) {
    return null;
  }

  const paragraphs = rowData.notification.description.split('\n\n');

  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <React.Fragment key={index}>
          {index > 0 && <div style={{ marginTop: '1rem' }} />}
          <Typography>{paragraph}</Typography>
        </React.Fragment>
      ))}
    </>
  );
};
const ResultItemTitleTemplate = (rowData: ResultItem) => {
  return (
    <>
      {rowData.link ? (
        <Link to={rowData.link} target="_blank" rel="noopener noreferrer">
          {rowData.title}
        </Link>
      ) : (
        <>{rowData.title}</>
      )}
    </>
  );
};

const FinishedTimeTemplate = (rowData: JobResult) => {
  const date = new Date(rowData.finishedTime);
  const dateString = date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });

  const timeString = date.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // This ensures 24-hour format
  });

  return `${dateString} ${timeString}`;
};
