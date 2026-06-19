import {
  DataTableFilterEvent,
  DataTablePageEvent,
  DataTableSortEvent,
} from 'primereact/datatable';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import useTicketStore from '../../stores/TicketStore';
import {
  generateDefaultTicketTableLazyState,
  hasFiltersChanged,
  hasSortChanged,
  LazyTicketTableState,
} from '../../types/tickets/table';
import useDebounce from '../../hooks/useDebounce';
import { useSearchTickets } from './components/grid/useLocalTickets';
import TicketsActionBar from './components/TicketsActionBar';
import { Box, Stack } from '@mui/system';
import BaseModal from '../../components/modal/BaseModal';
import BaseModalHeader from '../../components/modal/BaseModalHeader';
import BaseModalBody from '../../components/modal/BaseModalBody';
import {
  Button as MuiButton,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import BaseModalFooter from '../../components/modal/BaseModalFooter';
import { Ticket, TicketFilter } from '../../types/tickets/ticket';
import {
  useCreateTicketFilter,
  useUpdateTicketFilter,
} from '../../hooks/api/tickets/useUpdateTicketFilters';
import { useQueryClient } from '@tanstack/react-query';
import { snomioErrorHandler } from '../../types/ErrorHandler';
import {
  generateFilterConditions,
  generateOrderConditions,
} from './components/grid/GenerateFilterConditions';
import { SearchConditionBody } from '../../types/tickets/search';
import { TicketsBacklogView } from './components/grid/TicketsBacklogView';
import TicketsBulkEdit from './components/TicketsBulkEdit';
import { Route, Routes } from 'react-router-dom';
import TicketDrawer from './components/grid/TicketDrawer';
import BulkAddExternalRequestersModal from './components/BulkAddExternalRequestersModal.tsx';
import {
  useAllAdditionalFieldsTypes,
  useAllTicketFilters,
} from '../../hooks/api/useInitializeTickets.tsx';
import { generateSearchConditions } from './components/grid/GenerateSearchConditions.tsx';
import useAllBacklogFields from '../../hooks/api/tickets/useAllBacklogFields.tsx';
import { defaultTableFields } from './helpers/backlog.ts';

export default function TicketsBacklog() {
  const ticketStore = useTicketStore();

  const {
    availableStates,
    labels,
    externalRequestors,
    priorityBuckets,
    schedules,
    iterations,
    allTasks,
    jiraUsers,
  } = useAllBacklogFields();

  const { clearPagedTickets } = ticketStore;

  const initialLazyState = generateDefaultTicketTableLazyState();
  const [lazyState, setlazyState] =
    useState<LazyTicketTableState>(initialLazyState);

  const { loading, localTickets, totalRecords, searchTickets } =
    useSearchTickets();

  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const debouncedGlobalFilterValue = useDebounce(globalFilterValue, 1000);

  useEffect(() => {
    searchTickets(initialLazyState, globalFilterValue);
    // eslint-disable-next-line
  }, []);

  const [filterButtonsDisabled, setFilterButtonsDisabled] = useState(true);

  const [filters, setFilters] = useState<SearchConditionBody | undefined>(
    undefined,
  );

  const [createdCalenderAsRange, setCreatedCalenderAsRange] = useState(true);

  const [bulkEditOpen, setBulkEditOpen] = useState(false);

  const [bulkLoading, setBulkLoading] = useState(false);

  const [loadedFilter, setLoadedFilter] = useState<TicketFilter | undefined>(
    undefined,
  );

  useEffect(() => {
    const filters = lazyState.filters;
    setFilters(generateSearchConditions(lazyState, debouncedGlobalFilterValue));
    setFilterButtonsDisabled(
      !(
        hasFiltersChanged(filters) ||
        hasSortChanged(lazyState.sortField, lazyState.sortOrder)
      ),
    );
  }, [lazyState, debouncedGlobalFilterValue]);

  const initFilters = () => {
    setGlobalFilterValue('');
  };

  const clearFilter = useCallback(() => {
    handleFilterChange(undefined);
    initFilters();
    setLoadedFilter(undefined);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    initFilters();
  }, []);

  const handleFilterChange = (event: DataTableFilterEvent | undefined) => {
    setSelectedTickets([]);
    if (event == undefined) {
      initFilters();
      clearPagedTickets();
      const tempLazyState = generateDefaultTicketTableLazyState();
      setlazyState(tempLazyState);
      searchTickets(tempLazyState, debouncedGlobalFilterValue);
      return;
    }
    const tempLazyState = { ...lazyState, filters: event.filters };
    setlazyState(tempLazyState);
    searchTickets(tempLazyState, debouncedGlobalFilterValue);
  };

  useEffect(() => {
    searchTickets(lazyState, debouncedGlobalFilterValue);
    // eslint-disable-next-line
  }, [debouncedGlobalFilterValue]);

  const onSortChange = (event: DataTableSortEvent) => {
    const tempLazyState = {
      ...lazyState,
      sortField: event.sortField,
      sortOrder: event.sortOrder,
    };
    setlazyState(tempLazyState);
    searchTickets(tempLazyState, debouncedGlobalFilterValue);
  };

  const refresh = useCallback(() => {
    const tempLazyState = {
      ...lazyState,
    };
    setlazyState(tempLazyState);
    searchTickets(tempLazyState, debouncedGlobalFilterValue);
  }, [lazyState, debouncedGlobalFilterValue, searchTickets]);

  // overwrites the value for the title filter, as well as creates a comment filter
  const onGlobalFilterChange = useCallback(
    (value: string) => {
      setGlobalFilterValue(value);
    },
    [setGlobalFilterValue],
  );

  const onPaginationChange = (event: DataTablePageEvent) => {
    const tempLazyState = {
      ...lazyState,
      page: event.page ? event.page : 0,
      first: event.first,
      rows: event.rows,
    };
    setlazyState(tempLazyState);
    searchTickets(tempLazyState, debouncedGlobalFilterValue);
  };

  const handleSavedFilterLoad = useCallback(
    (ticketFilter: TicketFilter) => {
      setLoadedFilter(ticketFilter);
      const chosenFilter = ticketFilter;

      const generatedFilters = generateFilterConditions(
        chosenFilter.filter,
        priorityBuckets,
        iterations,
        availableStates,
        labels,
        externalRequestors,
        allTasks,
        jiraUsers,
        schedules,
      );

      const { sortField, sortOrder } = generateOrderConditions(
        chosenFilter.filter.orderCondition,
      );
      const tempLazyState = {
        ...lazyState,
        filters: generatedFilters,
        sortField: sortField,
        sortOrder: sortOrder,
      };
      setlazyState(tempLazyState);
      searchTickets(tempLazyState, debouncedGlobalFilterValue);
    },
    // eslint-disable-next-line
    [debouncedGlobalFilterValue],
  );

  const [selectedTickets, setSelectedTickets] = useState<Ticket[] | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const actionBarRef = useRef<HTMLDivElement>(null);
  const tableHeaderRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [backlogHeight, setBacklogHeight] = useState(0);

  useLayoutEffect(() => {
    if (
      containerRef.current &&
      actionBarRef.current &&
      tableHeaderRef.current &&
      titleRef.current
    ) {
      const containerHeight = containerRef.current.clientHeight;
      const actionBarHeight = actionBarRef.current.clientHeight;
      const tableHeaderHeight = tableHeaderRef.current.clientHeight;

      // Get the title height including margin
      const titleHeight = titleRef.current.offsetHeight;
      const titleStyles = window.getComputedStyle(titleRef.current);
      const titleMarginBottom = parseInt(titleStyles.marginBottom);

      setBacklogHeight(
        containerHeight -
          actionBarHeight -
          tableHeaderHeight -
          titleHeight -
          titleMarginBottom,
      );
    }
  }, [containerRef, actionBarRef, tableHeaderRef, titleRef]);

  const header = useMemo(() => {
    return (
      <div ref={tableHeaderRef}>
        <TicketTableHeader
          filterButtonsDisabled={filterButtonsDisabled}
          clearFilter={clearFilter}
          globalFilterValue={globalFilterValue}
          onGlobalFilterChange={onGlobalFilterChange}
          filters={filters}
          loadSavedFilter={handleSavedFilterLoad}
          loadedFilter={loadedFilter}
          bulkEditOpen={bulkEditOpen}
          setBulkEditOpen={setBulkEditOpen}
          refresh={refresh}
        />
        <Stack>
          {bulkEditOpen && (
            <TicketsBulkEdit
              tickets={selectedTickets}
              setTableLoading={setBulkLoading}
            />
          )}
        </Stack>
      </div>
    );
  }, [
    globalFilterValue,
    filterButtonsDisabled,
    clearFilter,
    onGlobalFilterChange,
    handleSavedFilterLoad,
    loadedFilter,
    bulkEditOpen,
    selectedTickets,
    setBulkLoading,
    filters,
    refresh,
  ]);

  return (
    <>
      <Stack sx={{ height: '100%' }} ref={containerRef}>
        <Box ref={titleRef} sx={{ mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Backlog
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            All tickets in the system with filtering and bulk edit capabilities
          </Typography>
        </Box>
        <div ref={actionBarRef}>
          <TicketsActionBar
            externalRequestorsEnabled
            createTaskEnabled
            createTicketEnabled
          />
        </div>
        <TicketsBacklogView
          height={backlogHeight}
          selectable={bulkEditOpen}
          fields={defaultTableFields}
          tickets={localTickets}
          totalRecords={totalRecords}
          loading={loading || bulkLoading}
          lazyState={lazyState}
          onSortChange={onSortChange}
          handleFilterChange={handleFilterChange}
          onPaginationChange={onPaginationChange}
          header={header}
          ticketStore={ticketStore}
          debouncedGlobalFilterValue={debouncedGlobalFilterValue}
          setGlobalFilterValue={setGlobalFilterValue}
          createdCalenderAsRange={createdCalenderAsRange}
          setCreatedCalenderAsRange={setCreatedCalenderAsRange}
          selectedTickets={selectedTickets}
          setSelectedTickets={setSelectedTickets}
        />
      </Stack>
      {/* </Grid> */}
      <Routes>
        <Route path="/individual/:ticketNumber" element={<TicketDrawer />} />
        <Route path="" element={<></>} />
      </Routes>
    </>
  );
}

interface TicketTableHeaderProps {
  filterButtonsDisabled: boolean;
  clearFilter: () => void;
  globalFilterValue: string;
  onGlobalFilterChange: (value: string) => void;
  filters?: SearchConditionBody;
  loadSavedFilter: (ticketFilter: TicketFilter) => void;
  loadedFilter?: TicketFilter;
  bulkEditOpen: boolean;
  setBulkEditOpen: (bool: boolean) => void;
  refresh: () => void;
}

// should maybe handle the disabled state internally
function TicketTableHeader({
  filterButtonsDisabled,
  clearFilter,
  globalFilterValue,
  onGlobalFilterChange,
  filters,
  loadSavedFilter,
  loadedFilter,
  bulkEditOpen,
  setBulkEditOpen,
  refresh,
}: TicketTableHeaderProps) {
  const [saveFilterModalOpen, setSaveFilterModalOpen] = useState(false);
  const [loadFilterModalOpen, setLoadFilterModalOpen] = useState(false);
  const [bulkAddExternalRequestersOpen, setBulkAddExternalRequestersOpen] =
    useState(false);
  const { additionalFieldTypes } = useAllAdditionalFieldsTypes();

  return (
    <>
      {saveFilterModalOpen && (
        <SaveFilterModal
          modalOpen={saveFilterModalOpen}
          setModalOpen={setSaveFilterModalOpen}
          filters={filters}
          loadedFilter={loadedFilter}
        />
      )}
      {loadFilterModalOpen && (
        <LoadFilterModal
          modalOpen={loadFilterModalOpen}
          setModalOpen={setLoadFilterModalOpen}
          loadSavedFilter={loadSavedFilter}
        />
      )}

      {bulkAddExternalRequestersOpen && (
        <BulkAddExternalRequestersModal
          open={bulkAddExternalRequestersOpen}
          defaultAdditionalFieldType={
            additionalFieldTypes.find(at => at.name === 'ARTGID') ||
            additionalFieldTypes[0] ||
            undefined
          }
          handleClose={() =>
            setBulkAddExternalRequestersOpen(!bulkAddExternalRequestersOpen)
          }
        />
      )}

      <div className="flex justify-content-between">
        <Stack flexDirection={'row'} gap={1}>
          <Button
            data-testid="backlog-filter-clear"
            type="button"
            icon="pi pi-filter-slash"
            label="Clear"
            disabled={filterButtonsDisabled}
            outlined
            onClick={clearFilter}
          />
          <Tooltip
            title={loadedFilter ? `Active filter: ${loadedFilter.name}` : ''}
            placement="bottom"
          >
            <span>
              <Button
                data-testid="backlog-filter-load"
                type="button"
                icon={loadedFilter ? 'pi pi-filter-fill' : 'pi pi-filter'}
                label={
                  loadedFilter ? (
                    <>
                      {'Loaded: '}
                      <span style={{ opacity: 0.6, fontWeight: 400 }}>
                        {loadedFilter.name.length > 20
                          ? `${loadedFilter.name.slice(0, 20)}…`
                          : loadedFilter.name}
                      </span>
                    </>
                  ) : (
                    'Load Filter'
                  )
                }
                outlined
                onClick={() => setLoadFilterModalOpen(!loadFilterModalOpen)}
              />
            </span>
          </Tooltip>
          <Button
            data-testid="backlog-filter-save"
            type="button"
            icon="pi pi-save"
            label="Save Filter"
            disabled={filterButtonsDisabled}
            outlined
            onClick={() => setSaveFilterModalOpen(!saveFilterModalOpen)}
          />
          <Button
            data-testid="backlog-bulk-edit"
            type="button"
            icon="pi pi-file-edit"
            label="Bulk Edit"
            disabled={false}
            outlined
            onClick={() => {
              setBulkEditOpen(!bulkEditOpen);
            }}
          />
          <Button
            data-testid="backlog-bulk-add-external-requester"
            type="button"
            icon="pi pi-upload"
            label="Bulk Add External Requesters"
            disabled={false}
            outlined
            onClick={() =>
              setBulkAddExternalRequestersOpen(!bulkAddExternalRequestersOpen)
            }
          />
        </Stack>
        <Stack flexDirection={'row'} gap={1}>
          <span className="p-input-icon-left">
            <i className="pi pi-search" style={{ left: '0.75rem' }} />
            <InputText
              id="backlog-quick-search"
              value={globalFilterValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onGlobalFilterChange(e.target.value)
              }
              placeholder="Quick Search"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </span>
          <Button
            data-testid="backlog-bulk-add-external-requester"
            type="button"
            icon="pi pi-refresh"
            disabled={false}
            label="Refresh"
            outlined
            onClick={() => refresh()}
          />
        </Stack>
      </div>
    </>
  );
}

interface SaveFilterModalProps {
  modalOpen: boolean;
  setModalOpen: (modalOpen: boolean) => void;
  filters?: SearchConditionBody;
  loadedFilter?: TicketFilter;
}
function SaveFilterModal({
  modalOpen,
  setModalOpen,
  filters,
  loadedFilter,
}: SaveFilterModalProps) {
  const [mode, setMode] = useState<'update' | 'new'>(
    loadedFilter ? 'update' : 'new',
  );
  const [newName, setNewName] = useState('');

  const { ticketFilters } = useAllTicketFilters();
  const postMutation = useCreateTicketFilter();
  const { data: postData, isError: postIsError } = postMutation;
  const putMutation = useUpdateTicketFilter();
  const { data: putData, isError: putIsError } = putMutation;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (postIsError) {
      snomioErrorHandler({
        status: 204,
        title: '',
        type: '',
        detail: '',
        message: '',
        name: '',
      });
    }
    if (postData) {
      void queryClient.invalidateQueries({ queryKey: ['ticket-filters'] });
      setModalOpen(false);
    }
  }, [postData, postIsError, queryClient, setModalOpen]);

  useEffect(() => {
    if (putIsError) {
      snomioErrorHandler({
        status: 204,
        title: '',
        type: '',
        detail: '',
        message: '',
        name: '',
      });
    }
    if (putData) {
      void queryClient.invalidateQueries({ queryKey: ['ticket-filters'] });
      setModalOpen(false);
    }
  }, [putData, putIsError, queryClient, setModalOpen]);

  const nameAlreadyExists = ticketFilters.some(f => f.name === newName.trim());

  const saveFilter = () => {
    if (mode === 'update' && loadedFilter) {
      putMutation.mutate({
        id: loadedFilter.id,
        ticketFilter: {
          ...loadedFilter,
          filter: filters as SearchConditionBody,
        },
      });
    } else {
      postMutation.mutate({
        name: newName.trim(),
        filter: filters as SearchConditionBody,
      });
    }
  };

  const isSaveDisabled =
    !filters ||
    (mode === 'new' && (newName.trim() === '' || nameAlreadyExists));

  return (
    <BaseModal open={modalOpen} handleClose={() => setModalOpen(!modalOpen)}>
      <BaseModalHeader title={'Save Filter'} />
      <BaseModalBody sx={{ paddingTop: '2em', paddingBottom: '2em' }}>
        {!filters ? (
          <Typography>No Filters selected</Typography>
        ) : (
          <Stack gap={2}>
            {loadedFilter && (
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_, val) => {
                  if (val) setMode(val);
                }}
                size="small"
                fullWidth
              >
                <Tooltip
                  title={
                    loadedFilter.name.length > 25
                      ? `Update "${loadedFilter.name}"`
                      : ''
                  }
                  placement="top"
                >
                  <ToggleButton
                    value="update"
                    data-testid="save-filter-mode-update"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 220,
                      display: 'block',
                    }}
                  >
                    Update &quot;
                    {loadedFilter.name.length > 25
                      ? `${loadedFilter.name.slice(0, 25)}…`
                      : loadedFilter.name}
                    &quot;
                  </ToggleButton>
                </Tooltip>
                <ToggleButton value="new" data-testid="save-filter-mode-new">
                  Save as New
                </ToggleButton>
              </ToggleButtonGroup>
            )}
            {mode === 'update' && loadedFilter && (
              <Typography variant="body2" color="warning.main">
                Warning: This will overwrite &quot;
                {loadedFilter.name.length > 40
                  ? `${loadedFilter.name.slice(0, 40)}…`
                  : loadedFilter.name}
                &quot; with the current filter settings.
              </Typography>
            )}
            {mode === 'new' && (
              <TextField
                data-testid="save-filter-modal-input"
                label="New filter name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                size="small"
                fullWidth
                autoFocus
                error={nameAlreadyExists}
                helperText={
                  nameAlreadyExists
                    ? 'A filter with this name already exists'
                    : ''
                }
                inputProps={{ maxLength: 100 }}
              />
            )}
          </Stack>
        )}
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Stack flexDirection="row" gap={1}>
            <MuiButton
              data-testid="save-filter-modal-save"
              color="primary"
              size="small"
              variant="contained"
              onClick={saveFilter}
              disabled={isSaveDisabled}
            >
              {mode === 'update' ? 'Update Filter' : 'Save Filter'}
            </MuiButton>
            <MuiButton
              data-testid="save-filter-modal-cancel"
              color="error"
              size="small"
              variant="contained"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </MuiButton>
          </Stack>
        }
      />
    </BaseModal>
  );
}

interface LoadFilterModalProps {
  modalOpen: boolean;
  setModalOpen: (modalOpen: boolean) => void;
  loadSavedFilter: (filter: TicketFilter) => void;
}

function LoadFilterModal({
  modalOpen,
  setModalOpen,
  loadSavedFilter,
}: LoadFilterModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('');
  const { ticketFilters } = useAllTicketFilters();

  const handleApplyFilter = () => {
    if (selectedFilter === '') return;

    const newFilter = ticketFilters.find(filter => {
      return filter.name === selectedFilter;
    });
    if (newFilter === undefined) return;

    loadSavedFilter(newFilter);
    setModalOpen(false);
  };

  return (
    <BaseModal open={modalOpen} handleClose={() => setModalOpen(!modalOpen)}>
      <BaseModalHeader title={'Load Filter'} />
      <BaseModalBody sx={{ paddingTop: '2.5em', paddingBottom: '2.5em' }}>
        <Select
          data-testid="load-filter-modal-input"
          value={selectedFilter || ''}
          onChange={e => setSelectedFilter(e.target.value)}
          sx={{ width: '100%' }}
          MenuProps={{
            PaperProps: {
              'data-testid': `load-filter-modal-input-dropdown`,
            },
          }}
        >
          {ticketFilters.map((filter, index) => (
            <MenuItem key={index} value={filter.name}>
              {filter.name}
            </MenuItem>
          ))}
        </Select>
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <MuiButton
            data-testid="load-filter-modal-submit"
            color={'primary'}
            size="small"
            variant="contained"
            onClick={handleApplyFilter}
            disabled={selectedFilter === ''}
          >
            Apply Filter
          </MuiButton>
        }
      />
    </BaseModal>
  );
}
