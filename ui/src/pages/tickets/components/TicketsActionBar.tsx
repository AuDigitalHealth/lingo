import { FileDownload } from '@mui/icons-material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { PlusCircleOutlined } from '@ant-design/icons';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { useSnackbar } from 'notistack';
import ExportModal from './ExportModal';
import CreateTicketModal from './CreateTicketModal';
import TasksCreateModal from '../../tasks/components/TasksCreateModal';
import { useApplicationConfig } from '../../../hooks/api/useInitializeConfig';
import useAvailableProjects, {
  getProjectsFromKeys,
} from '../../../hooks/api/useInitializeProjects';
import {
  useAllAdditionalFieldsTypes,
  useAllExportPresets,
  useAllExternalRequestors,
} from '../../../hooks/api/useInitializeTickets';
import {
  useCreateExportPreset,
  useDeleteExportPreset,
  useUpdateExportPreset,
} from '../../../hooks/api/tickets/useUpdateExportPresets';
import { SearchConditionBody } from '../../../types/tickets/search';
import {
  ExportPreset,
  ExportPresetConfig,
} from '../../../types/tickets/ticket';
import TicketsService from '../../../api/TicketsService';
import BaseModal from '../../../components/modal/BaseModal';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalFooter from '../../../components/modal/BaseModalFooter';

interface ColumnOption {
  key: string;
  label: string;
}

// Sentinel key representing the whole "External Requestors with Date Requested" positional
// column group as one reorderable unit. The real columns (External Requester 1, 1 Date
// Requested, …) are dynamic-count and expanded server-side at this position. Must match the
// value used by ExportService on the backend.
const ER_POSITIONAL_KEY = '__erPositional__';

const DEFAULT_COLUMNS: ColumnOption[] = [
  { key: 'ticketNumber', label: 'Ticket Number' },
  { key: 'createdDate', label: 'Created Date' },
  { key: 'title', label: 'Title' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'priority', label: 'Priority' },
  { key: 'iteration', label: 'Release' },
  { key: 'status', label: 'Status' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'closedDate', label: 'Closed Date' },
];

const OPTIONAL_COLUMNS: ColumnOption[] = [
  { key: 'description', label: 'Description' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'labels', label: 'Labels' },
  { key: 'hasProducts', label: 'Has Products' },
  { key: 'modifiedDate', label: 'Modified Date' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'modifiedBy', label: 'Modified By' },
];

// A single drag-sortable row in the Column Preview list.
function SortableColumnRow({
  columnKey,
  label,
  position,
}: {
  columnKey: string;
  label: string;
  position: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: columnKey });
  return (
    <Stack
      ref={setNodeRef}
      direction="row"
      alignItems="center"
      gap={1}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        cursor: 'grab',
      }}
      sx={{
        px: 1,
        py: 0.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        userSelect: 'none',
      }}
    >
      <DragIndicatorIcon fontSize="small" sx={{ color: 'text.disabled' }} />
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', minWidth: 20 }}
      >
        {position}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
    </Stack>
  );
}

// "Select all / Clear" affordance shared by the multi-select dropdowns.
function SelectAllControls({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const allSelected = options.length > 0 && value.length === options.length;
  return (
    <Stack direction="row" gap={0.5} sx={{ mb: 0.5 }}>
      <Button
        size="small"
        variant="text"
        disabled={options.length === 0 || allSelected}
        onClick={() => onChange([...options])}
      >
        Select all
      </Button>
      <Button
        size="small"
        variant="text"
        color="inherit"
        disabled={value.length === 0}
        onClick={() => onChange([])}
      >
        Clear
      </Button>
    </Stack>
  );
}

interface TicketsActionBarProps {
  externalRequestorsEnabled?: boolean;
  createTaskEnabled?: boolean;
  createTicketEnabled?: boolean;
  filters?: SearchConditionBody;
  totalRecords?: number;
}

export default function TicketsActionBar({
  externalRequestorsEnabled,
  createTaskEnabled,
  createTicketEnabled,
  filters,
  totalRecords,
}: TicketsActionBarProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [tasksModalOpen, setTasksModalOpen] = useState(false);
  const [confirmExportOpen, setConfirmExportOpen] = useState(false);
  const [backlogExportLoading, setBacklogExportLoading] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    DEFAULT_COLUMNS.map(c => c.key),
  );
  const [selectedAdditionalFields, setSelectedAdditionalFields] = useState<
    string[]
  >([]);
  const [selectedErColumns, setSelectedErColumns] = useState<string[]>([]);
  const [erDateRequested, setErDateRequested] = useState(false);
  const [erDateAdded, setErDateAdded] = useState(false);
  const [erWithDateRequested, setErWithDateRequested] = useState(false);
  // User-defined export column order (backend column keys). Empty = natural order.
  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Preset state
  const [selectedPresetId, setSelectedPresetId] = useState<number | ''>('');
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const { applicationConfig } = useApplicationConfig();
  const { data: projects } = useAvailableProjects();
  const project = getProjectsFromKeys(
    applicationConfig?.apProjectKeys,
    projects,
  );
  const { externalRequestors } = useAllExternalRequestors();
  const { additionalFieldTypes } = useAllAdditionalFieldsTypes();
  const { exportPresets } = useAllExportPresets();
  const createPreset = useCreateExportPreset();
  const updatePreset = useUpdateExportPreset();
  const deletePreset = useDeleteExportPreset();

  // Additional field selections are keyed by the type's name (that's what the backend and the
  // saved presets use), but the user sees the display name. Falls back to the name if a saved
  // preset references a since-deleted type.
  const afDisplayName = (name: string) =>
    additionalFieldTypes.find(a => a.name === name)?.displayName ?? name;

  const toggleColumn = (key: string, checked: boolean) => {
    setSelectedColumns(prev =>
      checked ? [...prev, key] : prev.filter(k => k !== key),
    );
  };

  // The active output columns in their "natural" order (before any user reordering).
  // The positional "External Requester N" columns are dynamic-count (resolved server-side
  // at export time), so they are represented as a single reorderable group via the
  // ER_POSITIONAL_KEY sentinel — the group can be moved anywhere, but not split apart.
  const naturalColumns: ColumnOption[] = [
    ...DEFAULT_COLUMNS.filter(col => selectedColumns.includes(col.key)),
    ...OPTIONAL_COLUMNS.filter(col => selectedColumns.includes(col.key)),
    ...selectedAdditionalFields.map(name => ({
      key: `af_${name}`,
      label: afDisplayName(name),
    })),
    ...selectedErColumns.flatMap(name => [
      { key: `er_${name}`, label: name },
      ...(erDateRequested
        ? [{ key: `er_dateRequested_${name}`, label: `${name} Date Requested` }]
        : []),
      ...(erDateAdded
        ? [{ key: `er_dateAdded_${name}`, label: `${name} Added Date` }]
        : []),
    ]),
    ...(erWithDateRequested
      ? [
          {
            key: ER_POSITIONAL_KEY,
            label:
              'All External Requesters + Date Requested (positional group)',
          },
        ]
      : []),
  ];

  // Apply the user's custom order: keys present in columnOrder sort by their index;
  // anything not yet ordered keeps its natural position at the end. Stable regardless
  // of engine sort behaviour.
  const orderRank = (key: string) => {
    const i = columnOrder.indexOf(key);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  const orderedColumns: ColumnOption[] = naturalColumns
    .map((col, index) => ({ col, index }))
    .sort(
      (a, b) =>
        orderRank(a.col.key) - orderRank(b.col.key) || a.index - b.index,
    )
    .map(x => x.col);

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const keys = orderedColumns.map(c => c.key);
    const oldIndex = keys.indexOf(active.id as string);
    const newIndex = keys.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    setColumnOrder(arrayMove(keys, oldIndex, newIndex));
  };

  const buildConfig = (): ExportPresetConfig => ({
    columns: selectedColumns,
    additionalFieldColumns: selectedAdditionalFields,
    externalRequestorColumns: selectedErColumns,
    erDateRequested,
    erDateAdded,
    erWithDateRequested,
    columnOrder: orderedColumns.map(c => c.key),
  });

  const applyConfig = (config: ExportPresetConfig) => {
    setSelectedColumns(config.columns ?? []);
    setSelectedAdditionalFields(config.additionalFieldColumns ?? []);
    setSelectedErColumns(config.externalRequestorColumns ?? []);
    setErDateRequested(config.erDateRequested ?? false);
    setErDateAdded(config.erDateAdded ?? false);
    setErWithDateRequested(config.erWithDateRequested ?? false);
    setColumnOrder(config.columnOrder ?? []);
  };

  // Reset the export form to its defaults so a freshly opened dialog never inherits
  // the previous session's column/preset selections.
  const resetExportForm = () => {
    setSelectedColumns(DEFAULT_COLUMNS.map(c => c.key));
    setSelectedAdditionalFields([]);
    setSelectedErColumns([]);
    setErDateRequested(false);
    setErDateAdded(false);
    setErWithDateRequested(false);
    setColumnOrder([]);
    setSelectedPresetId('');
  };

  const openExportModal = () => {
    resetExportForm();
    setConfirmExportOpen(true);
  };

  const handleLoadPreset = (event: SelectChangeEvent<number | ''>) => {
    const value = event.target.value;
    if (value === '') {
      setSelectedPresetId('');
      return;
    }
    const id = Number(value);
    const preset = exportPresets.find(p => p.id === id);
    if (preset) {
      applyConfig(preset.config);
      setSelectedPresetId(id);
    }
  };

  const handleSaveNewPreset = () => {
    const name = newPresetName.trim();
    if (!name) return;
    createPreset.mutate(
      { name, config: buildConfig() },
      {
        onSuccess: (created: ExportPreset) => {
          setSelectedPresetId(created.id);
          setSavePresetOpen(false);
          setNewPresetName('');
          enqueueSnackbar(`Saved export preset "${name}"`, {
            variant: 'success',
          });
        },
        onError: error => {
          enqueueSnackbar(`Error saving preset: ${error.message}`, {
            variant: 'error',
          });
        },
      },
    );
  };

  const handleUpdatePreset = () => {
    if (selectedPresetId === '') return;
    const preset = exportPresets.find(p => p.id === selectedPresetId);
    if (!preset) return;
    updatePreset.mutate(
      {
        id: selectedPresetId,
        preset: { name: preset.name, config: buildConfig() },
      },
      {
        onSuccess: () => {
          enqueueSnackbar(`Updated export preset "${preset.name}"`, {
            variant: 'success',
          });
        },
        onError: error => {
          enqueueSnackbar(`Error updating preset: ${error.message}`, {
            variant: 'error',
          });
        },
      },
    );
  };

  const handleDeletePreset = () => {
    if (selectedPresetId === '') return;
    const preset = exportPresets.find(p => p.id === selectedPresetId);
    deletePreset.mutate(selectedPresetId, {
      onSuccess: () => {
        setSelectedPresetId('');
        enqueueSnackbar(`Deleted export preset "${preset?.name ?? ''}"`, {
          variant: 'success',
        });
      },
      onError: error => {
        enqueueSnackbar(`Error deleting preset: ${error.message}`, {
          variant: 'error',
        });
      },
    });
  };

  const handleBacklogExport = async () => {
    setConfirmExportOpen(false);
    setBacklogExportLoading(true);
    try {
      await TicketsService.exportBacklogCsv(
        filters,
        selectedColumns,
        selectedAdditionalFields.length > 0
          ? selectedAdditionalFields
          : undefined,
        selectedErColumns.length > 0 ? selectedErColumns : undefined,
        erDateRequested || undefined,
        erDateAdded || undefined,
        erWithDateRequested || undefined,
        orderedColumns.map(c => c.key),
      );
    } finally {
      setBacklogExportLoading(false);
    }
  };

  return (
    <>
      <TasksCreateModal
        title="Create Task"
        open={tasksModalOpen}
        handleClose={() => setTasksModalOpen(false)}
        redirectEnabled={false}
        projectsOptions={project ? project : []}
        redirectUrl=""
      />
      <CreateTicketModal
        open={ticketModalOpen}
        handleClose={() => setTicketModalOpen(false)}
        title={'Create Ticket'}
      />
      <ExportModal
        open={exportModalOpen}
        handleClose={() => setExportModalOpen(false)}
        title={'External Requesters Report'}
      />
      <BaseModal
        open={savePresetOpen}
        handleClose={() => setSavePresetOpen(false)}
        sx={{ minWidth: '420px' }}
      >
        <BaseModalHeader title={'Save Export Preset'} />
        <BaseModalBody>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Save the current column and external-requestor selection as a named
            preset that the whole team can reuse.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Preset name"
            placeholder="e.g. ADHA export"
            value={newPresetName}
            onChange={e => setNewPresetName(e.target.value)}
          />
        </BaseModalBody>
        <BaseModalFooter
          startChildren={
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              onClick={() => setSavePresetOpen(false)}
            >
              Cancel
            </Button>
          }
          endChildren={
            <Button
              color="primary"
              size="small"
              variant="contained"
              disabled={!newPresetName.trim() || createPreset.isPending}
              onClick={handleSaveNewPreset}
            >
              Save
            </Button>
          }
        />
      </BaseModal>
      <BaseModal
        open={confirmExportOpen}
        handleClose={() => setConfirmExportOpen(false)}
        sx={{ minWidth: '520px' }}
      >
        <BaseModalHeader title={'Export Backlog to CSV'} />
        <BaseModalBody
          sx={{
            display: 'block',
            maxHeight: '70vh',
            width: '520px',
            maxWidth: '90vw',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <Typography variant="body2" sx={{ mb: 2 }}>
            {totalRecords !== undefined
              ? `Exporting ${totalRecords} ticket${totalRecords !== 1 ? 's' : ''} based on the current filters.`
              : 'Export tickets matching the current filters.'}
          </Typography>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Preset
          </Typography>
          <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 1 }}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="export-preset-label">Load preset</InputLabel>
              <Select
                labelId="export-preset-label"
                label="Load preset"
                value={selectedPresetId}
                onChange={handleLoadPreset}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {exportPresets.map(preset => (
                  <MenuItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setNewPresetName('');
                setSavePresetOpen(true);
              }}
            >
              Save as…
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={selectedPresetId === '' || updatePreset.isPending}
              onClick={handleUpdatePreset}
            >
              Update
            </Button>
            <Tooltip title="Delete preset">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={selectedPresetId === '' || deletePreset.isPending}
                  onClick={handleDeletePreset}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Columns
          </Typography>
          <Grid container columnSpacing={1}>
            {DEFAULT_COLUMNS.map(col => (
              <Grid item xs={6} key={col.key}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedColumns.includes(col.key)}
                      onChange={e => toggleColumn(col.key, e.target.checked)}
                    />
                  }
                  label={col.label}
                />
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 1.5 }} />

          <Grid container columnSpacing={1}>
            {OPTIONAL_COLUMNS.map(col => (
              <Grid item xs={6} key={col.key}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedColumns.includes(col.key)}
                      onChange={e => toggleColumn(col.key, e.target.checked)}
                    />
                  }
                  label={col.label}
                />
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Additional Fields
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1.5, display: 'block' }}
          >
            Adds a column per selected additional field (e.g. ARTG ID) with its
            value for each ticket.
          </Typography>
          <SelectAllControls
            options={additionalFieldTypes.map(a => a.name)}
            value={selectedAdditionalFields}
            onChange={setSelectedAdditionalFields}
          />
          <Autocomplete
            multiple
            size="small"
            options={additionalFieldTypes.map(a => a.name)}
            getOptionLabel={afDisplayName}
            value={selectedAdditionalFields}
            onChange={(_, newValue) => setSelectedAdditionalFields(newValue)}
            renderInput={params => (
              <TextField
                {...params}
                label="Additional Fields"
                placeholder="Select additional fields…"
              />
            )}
          />

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            External Requestors
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={erWithDateRequested}
                onChange={e => setErWithDateRequested(e.target.checked)}
              />
            }
            label="All External Requestors with Date Requested"
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1.5, display: 'block' }}
          >
            Adds paired columns (External Requester 1, 2, 3…) listing every
            external requestor on the ticket, ordered by requested date, with
            the date alongside. Requestors without a requested date are listed
            last with the date left blank.
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1.5, display: 'block' }}
          >
            Or add one column per specific requestor selected below, with
            optional date sub-columns.
          </Typography>
          <Stack gap={1.5}>
            <Box>
              <SelectAllControls
                options={externalRequestors.map(er => er.name)}
                value={selectedErColumns}
                onChange={setSelectedErColumns}
              />
              <Autocomplete
                multiple
                size="small"
                options={externalRequestors.map(er => er.name)}
                value={selectedErColumns}
                onChange={(_, newValue) => setSelectedErColumns(newValue)}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="External Requestors"
                    placeholder="Select external requestors…"
                  />
                )}
              />
            </Box>
            {selectedErColumns.length > 0 && (
              <Stack direction="row" gap={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={erDateRequested}
                      onChange={e => setErDateRequested(e.target.checked)}
                    />
                  }
                  label="Include Date Requested"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={erDateAdded}
                      onChange={e => setErDateAdded(e.target.checked)}
                    />
                  }
                  label="Include Date Added"
                />
              </Stack>
            )}
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Column Preview ({orderedColumns.length})
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: 'block' }}
          >
            Drag to set the column order in the exported CSV. Saved with each
            preset. The positional group expands into its "External Requester N"
            columns at wherever you place it.
          </Typography>
          {orderedColumns.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              No columns selected.
            </Typography>
          ) : (
            <Stack gap={0.5}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleColumnDragEnd}
              >
                <SortableContext
                  items={orderedColumns.map(c => c.key)}
                  strategy={verticalListSortingStrategy}
                >
                  {orderedColumns.map((col, i) => (
                    <SortableColumnRow
                      key={col.key}
                      columnKey={col.key}
                      label={col.label}
                      position={i + 1}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </Stack>
          )}
        </BaseModalBody>
        <BaseModalFooter
          startChildren={
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              onClick={() => setConfirmExportOpen(false)}
            >
              Cancel
            </Button>
          }
          endChildren={
            <Button
              color="primary"
              size="small"
              variant="contained"
              startIcon={<FileDownload />}
              disabled={selectedColumns.length === 0}
              onClick={() => void handleBacklogExport()}
            >
              Export
            </Button>
          }
        />
      </BaseModal>
      <Stack
        sx={{
          width: '100%',
          padding: '0em 0em 1em 1em',
          flexDirection: 'row',
          gap: 1,
        }}
      >
        <Stack flexDirection="row" gap={1}>
          {externalRequestorsEnabled && (
            <Button
              variant="contained"
              color="info"
              startIcon={<FileDownload />}
              onClick={() => setExportModalOpen(true)}
            >
              External Requesters Report
            </Button>
          )}
          <Button
            variant="outlined"
            color="info"
            startIcon={<FileDownload />}
            disabled={backlogExportLoading}
            onClick={openExportModal}
          >
            {backlogExportLoading ? 'Exporting...' : 'Export Backlog to CSV'}
          </Button>
        </Stack>
        <Stack
          gap={1}
          display={'flex'}
          flexDirection={'row'}
          sx={{ marginLeft: 'auto' }}
        >
          {createTaskEnabled && (
            <Button
              id="create-task"
              variant="contained"
              color="success"
              startIcon={<PlusCircleOutlined />}
              onClick={() => setTasksModalOpen(true)}
            >
              Create Task
            </Button>
          )}
          {createTicketEnabled && (
            <Button
              data-testid="create-ticket"
              id="create-ticket"
              variant="contained"
              color="success"
              startIcon={<PlusCircleOutlined />}
              onClick={() => setTicketModalOpen(true)}
            >
              Create Ticket
            </Button>
          )}
        </Stack>
      </Stack>
    </>
  );
}
