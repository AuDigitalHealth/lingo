import './TicketBacklog.css';
import {
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import useTicketStore from '../../stores/TicketStore';
import {
  AdditionalFieldValue,
  Iteration,
  LabelType,
  PagedTicket,
  PriorityBucket,
  State,
  Ticket,
  TicketDto,
} from '../../types/tickets/ticket';
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
  GridValueFormatterParams,
} from '@mui/x-data-grid';
import { Link } from 'react-router-dom';
import { mapToStateOptions } from '../../utils/helpers/tickets/stateUtils';
import useJiraUserStore from '../../stores/JiraUserStore';
import { mapToUserOptions } from '../../utils/helpers/userUtils';
import { Card, ListItem, ListItemIcon } from '@mui/material';
import { mapToLabelOptions } from '../../utils/helpers/tickets/labelUtils';
import CustomTicketLabelSelection from './components/CustomTicketLabelSelection';
import { mapToIterationOptions } from '../../utils/helpers/tickets/iterationUtils';
import CustomIterationSelection from './components/CustomIterationSelection';
import { mapToPriorityOptions } from '../../utils/helpers/tickets/priorityUtils';
import TicketsService from '../../api/TicketsService';
import {
  Block,
  PriorityHigh,
  ArrowCircleUp,
  ArrowCircleDown,
} from '@mui/icons-material';

export type SortableTableRowProps = {
  id: number;
  value: string;
};
import { TableHeadersPaginationSearch } from './components/TableHeaderPaginationSearch';
import { validateQueryParams } from '../../utils/helpers/queryUtils';
import CustomTicketAssigneeSelection from './components/CustomTicketAssigneeSelection';
import CustomStateSelection from './components/CustomStateSelection';

const PAGE_SIZE = 20;
// Fully paginated, how this works might? have to be reworked when it comes to adding the search functionality.
function TicketsBacklog() {
  const {
    addPagedTickets,
    pagedTickets,
    availableStates,
    labelTypes,
    iterations,
    priorityBuckets,
    getPagedTicketByPageNumber,
    queryString,
    addQueryTickets,
    queryPagedTickets,
    getQueryPagedTicketByPageNumber,
    clearQueryTickets,
  } = useTicketStore();
  const { jiraUsers } = useJiraUserStore();
  const heading = 'Backlog';
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: PAGE_SIZE,
  });
  const [rowCount, setRowCount] = useState(PAGE_SIZE);
  const [localTickets, setLocalTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePagedTicketChange = useCallback(() => {
    const localPagedTickets = validateQueryParams(queryString)
      ? getQueryPagedTicketByPageNumber(paginationModel.page)
      : getPagedTicketByPageNumber(paginationModel.page);
    if (localPagedTickets?.page.totalElements) {
      setRowCount(localPagedTickets?.page.totalElements);
    }
    setLocalTickets(
      localPagedTickets?._embedded.ticketDtoList
        ? localPagedTickets?._embedded.ticketDtoList
        : [],
    );
  }, [
    getPagedTicketByPageNumber,
    getQueryPagedTicketByPageNumber,
    paginationModel.page,
    queryString,
  ]);

  const getQueryPagedTickets = useCallback(() => {
    setLoading(true);
    TicketsService.searchPaginatedTickets(queryString, paginationModel.page, 20)
      .then((pagedTickets: PagedTicket) => {
        setLoading(false);
        if (pagedTickets.page.totalElements > 0) {
          addQueryTickets(pagedTickets);
        } else if (pagedTickets.page.totalPages === 0) {
          clearQueryTickets();
        }
      })
      .catch(err => console.log(err));
  }, [addQueryTickets, clearQueryTickets, paginationModel.page, queryString]);

  const getPagedTickets = useCallback(() => {
    setLoading(true);
    TicketsService.getPaginatedTickets(paginationModel.page, 20)
      .then((pagedTickets: PagedTicket) => {
        if (pagedTickets.page.totalElements > 0) {
          addPagedTickets(pagedTickets);
        }
        setLoading(false);
      })
      .catch(err => console.log(err));
  }, [addPagedTickets, paginationModel.page]);

  useEffect(() => {
    handlePagedTicketChange();
  }, [handlePagedTicketChange, pagedTickets, queryPagedTickets]);

  useEffect(() => {
    const localPagedTickets = validateQueryParams(queryString)
      ? getQueryPagedTicketByPageNumber(paginationModel.page)?._embedded
          .ticketDtoList
      : getPagedTicketByPageNumber(paginationModel.page)?._embedded
          .ticketDtoList;
    if (localPagedTickets) {
      setLocalTickets(localPagedTickets ? localPagedTickets : []);
    } else {
      validateQueryParams(queryString)
        ? getQueryPagedTickets()
        : getPagedTickets();
    }
  }, [
    getPagedTicketByPageNumber,
    getPagedTickets,
    getQueryPagedTicketByPageNumber,
    getQueryPagedTickets,
    paginationModel,
    queryString,
  ]);

  useEffect(() => {
    if (
      queryString === '' ||
      queryString === undefined ||
      queryString === null
    ) {
      handlePagedTicketChange();
    } else if (validateQueryParams(queryString)) {
      setPaginationModel({
        page: 0,
        pageSize: 20,
      });
      getQueryPagedTickets();
    }
  }, [getQueryPagedTickets, handlePagedTicketChange, queryString]);

  const columns: GridColDef[] = [
    {
      field: 'priorityBucket',
      headerName: 'Priority',
      maxWidth: 60,
      valueOptions: mapToPriorityOptions(priorityBuckets),
      type: 'singleSelect',
      valueGetter: (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params: GridRenderCellParams<any, PriorityBucket>,
      ): string | undefined => {
        return params.value?.name;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => {
        // Define styles inline
        const iconMapping: Record<string, React.ReactNode> = {
          blocker: <Block />,
          major: <ArrowCircleUp />,
          minor: <ArrowCircleDown />,
          critical: <PriorityHigh />,
          default: <div />,
        };
        const iconStyle: CSSProperties = {
          marginRight: '8px', // Adjust spacing between icon and text
        };
        const selectedIcon = iconMapping[params.value!] || iconMapping.default;
        return (
          <ListItem component="li">
            <ListItemIcon style={iconStyle}>{selectedIcon}</ListItemIcon>
          </ListItem>
        );
      },
    },
    {
      field: 'title',
      headerName: 'Title',
      minWidth: 600,
      flex: 1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => {
        return (
          <Link
            to={`/dashboard/tickets/individual/${params.id}`}
            className="link"
          >
            {params.value!.toString()}
          </Link>
        );
      },
    },
    {
      field: 'schedule',
      headerName: 'Schedule',
      flex: 1,
      maxWidth: 90,
      type: 'singleSelect',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => {
        return <div>{params.value}</div>;
      },
      valueGetter: (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params: GridRenderCellParams<any, TicketDto>,
      ): string | undefined => {
        const row = params.row as TicketDto;
        const thisAdditionalFieldTypeValue = mapAdditionalFieldValueToType(
          row['ticket-additional-fields'],
          'Schedule',
        );
        return thisAdditionalFieldTypeValue?.valueOf;
      },
    },
    {
      field: 'iteration',
      headerName: 'Iteration',
      minWidth: 180,
      maxWidth: 250,
      type: 'singleSelect',
      valueOptions: mapToIterationOptions(iterations),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <CustomIterationSelection
          id={params.id as string}
          iterationList={iterations}
          iteration={params.value}
        />
      ),
      valueGetter: (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params: GridRenderCellParams<any, Iteration>,
      ): string | undefined => {
        return params.value?.name;
      },
    },
    {
      field: 'state',
      headerName: 'Status',
      flex: 1,
      maxWidth: 140,
      type: 'singleSelect',
      valueOptions: mapToStateOptions(availableStates),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => {
        return (
          <CustomStateSelection
            id={params.id as string}
            stateList={availableStates}
            state={params.value}
          />
        );
      },
      valueGetter: (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params: GridRenderCellParams<any, State>,
      ): string | undefined => {
        return params.value?.label;
      },
    },
    {
      field: 'labels',
      headerName: 'Labels',
      flex: 1,
      maxWidth: 300,
      valueOptions: mapToLabelOptions(labelTypes),
      // This and the value getter might look bizarre, but it is necassary to be able to filter
      // on a multi select field
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => {
        const items = params.value?.split(',');
        if (items && items[0] === '') {
          items.pop();
        }

        return (
          <CustomTicketLabelSelection
            labelTypeList={labelTypes}
            labels={items}
            id={params.id as string}
          />
        );
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      valueGetter: (params: GridRenderCellParams<any, LabelType[]>): string => {
        const values = params.value?.map((labelType: LabelType) => {
          return labelType?.id.toString() + '|' + labelType?.name;
        });
        if (values === undefined) return '';
        return values?.toString();
      },
    },
    {
      field: 'assignee',
      headerName: 'Assignee',
      flex: 1,
      maxWidth: 100,
      type: 'singleSelect',
      valueOptions: mapToUserOptions(jiraUsers),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (params: GridRenderCellParams<any, string>): ReactNode => (
        <CustomTicketAssigneeSelection
          id={params.id as string}
          user={params.value}
          userList={jiraUsers}
        />
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      valueGetter: (params: GridRenderCellParams<any, string>): string => {
        return params.value as string;
      },
    },
    {
      field: 'created',
      headerName: 'Created',
      flex: 1,
      maxWidth: 110,
      valueFormatter: ({ value }: GridValueFormatterParams<string>) => {
        const date = new Date(value);
        return date.toLocaleDateString('en-AU');
      },
    },
  ];

  const mapAdditionalFieldValueToType = (
    value: AdditionalFieldValue[] | undefined,
    fieldType: string,
  ): AdditionalFieldValue | undefined => {
    return value?.find(item => {
      return (
        item.additionalFieldType.name.toLowerCase() == fieldType.toLowerCase()
      );
    });
  };

  const handleModelChange = (newPaginationModel: GridPaginationModel) => {
    setPaginationModel(newPaginationModel);
  };

  return (
    <>
      <Card>
        <DataGrid
          //   density={true ? 'compact' : 'standard'}
          density="compact"
          getRowHeight={() => 'auto'}
          showColumnVerticalBorder={true}
          showCellVerticalBorder={false}
          sx={{
            width: '100% !important',
            fontWeight: 400,
            fontSize: 14,
            borderRadius: 0,
            border: 0,
            color: '#003665',
            '& .MuiDataGrid-row': {
              borderBottom: 1,
              borderColor: 'rgb(240, 240, 240)',
              minHeight: 'auto !important',
              maxHeight: 'none !important',
              paddingLeft: '5px',
              paddingRight: '5px',
            },
            '& .MuiDataGrid-cell': {
              borderColor: 'rgb(240, 240, 240)',
            },
            '& .MuiDataGrid-columnHeaders': {
              border: 0,
              borderTop: 0,
              borderBottom: 1,
              borderColor: 'rgb(240, 240, 240)',
              borderRadius: 0,
              backgroundColor: 'rgb(250, 250, 250)',
              paddingLeft: '10px',
              paddingRight: '10px',
              textDecoration: 'underline',
            },
            '& .MuiDataGrid-footerContainer': {
              border: 0,
              // If you want to keep the pagination controls consistently placed page-to-page
              // marginTop: `${(pageSize - userDataList.length) * ROW_HEIGHT}px`
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
              color: '#003665',
            },
          }}
          getRowId={(row: Ticket) => row.id}
          slots={{ toolbar: TableHeadersPaginationSearch }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
              tableName: heading,
            },
          }}
          rows={localTickets}
          columns={columns}
          hideFooterSelectedRowCount
          disableDensitySelector
          disableColumnFilter={false}
          disableColumnMenu={false}
          disableRowSelectionOnClick={false}
          hideFooter={false}
          paginationMode="server"
          pageSizeOptions={[20]}
          loading={loading}
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={handleModelChange}
        />
      </Card>
    </>
  );
}

export default TicketsBacklog;
