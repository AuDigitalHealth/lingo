import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  Stack,
  Divider,
  Avatar,
} from '@mui/material';
import DOMPurify from 'dompurify';
import {
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Label as LabelIcon,
  Assignment as AssignmentIcon,
  Stairs as StateIcon,
  Schedule as ScheduleIcon,
  Comment as CommentIcon,
  AttachFile as AttachFileIcon,
  PriorityHigh as PriorityIcon,
} from '@mui/icons-material';
import {
  ExternalRequestor,
  Iteration,
  LabelType,
  PriorityBucket,
  State,
  TicketHistoryEntryDto,
} from '../../../types/tickets/ticket';
import {
  useAllExternalRequestors,
  useAllIterations,
  useAllLabels,
  useAllPriorityBuckets,
  useAllStates,
} from '../../../hooks/api/useInitializeTickets';
import LabelChip from '../components/LabelChip';
import { PriorityItemDisplay } from '../components/grid/CustomPrioritySelection';
import { StateItemDisplay } from '../components/grid/CustomStateSelection';
import { IterationItemDisplay } from '../components/grid/CustomIterationSelection';
import { LabelTypeItemDisplay } from '../components/grid/CustomTicketLabelSelection';
import { capitalize } from '@mui/material';
import AvatarWithTooltip from '../../../components/AvatarWithTooltip';
import { ExternalRequestorItemDisplay } from '../components/grid/CustomTicketExternalRequestorSelection';

interface TicketHistoryProps {
  ticketHistory: TicketHistoryEntryDto[] | undefined;
  ticketId?: number;
}

// Helper function to format timestamp
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays === 0) {
    return date.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Australia/Sydney',
    });
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return date.toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      timeZone: 'Australia/Sydney',
    });
  }
};

// Helper function to get color for change type
const getChangeColor = (
  revisionType: string,
): 'success' | 'error' | 'primary' => {
  switch (revisionType) {
    case 'INSERT':
      return 'success';
    case 'DELETE':
      return 'error';
    case 'UPDATE':
    default:
      return 'primary';
  }
};

// Individual history entry component
const HistoryEntry: React.FC<{ entry: TicketHistoryEntryDto }> = ({
  entry,
}) => {
  const changeColor = getChangeColor(entry.revisionType);

  const renderUser = (username: string | null | undefined) => {
    return <AvatarWithTooltip username={username ? username : 'system'} />;
  };

  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="flex-start"
      sx={{ py: 1, borderLeft: '2px solid #f0f0f0', pl: 2, ml: 1 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          mt: 0.25,
        }}
      >
        {renderUser(entry.username)}
      </Box>

      {/* Content */}
      <Stack spacing={0.5} flex={1} minWidth={0}>
        {/* Show change details for specific field types */}
        {(entry.oldValue || entry.newValue) && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 3 }}>
            <ChangeRenderer item={entry} />
          </Stack>
        )}
      </Stack>

      {/* Timestamp */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ flexShrink: 0, mt: 0.5 }}
      >
        {formatTimestamp(entry.timestamp)}
      </Typography>
    </Stack>
  );
};

export default function TicketHistory({
  ticketHistory,
  ticketId,
}: TicketHistoryProps) {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  // Sort history by timestamp (most recent first)
  const sortedHistory = ticketHistory
    ? [...ticketHistory].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
    : [];

  return (
    <>
      <Divider sx={{ marginTop: '1.5em', marginBottom: '1.5em' }} />
      <Accordion
        expanded={expanded}
        onChange={handleExpandClick}
        sx={{
          boxShadow: 'none',
          '&:before': { display: 'none' },
          '&.Mui-expanded': { margin: 0 },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="ticket-history-content"
          id="ticket-history-header"
          sx={{
            padding: 0,
            '& .MuiAccordionSummary-content': { margin: 0 },
            '& .MuiAccordionSummary-content.Mui-expanded': { margin: 0 },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <HistoryIcon />
            <Typography variant="h6">History</Typography>
            <Chip
              label={`${ticketHistory?.length} changes`}
              size="small"
              variant="outlined"
            />
          </Stack>
        </AccordionSummary>

        <AccordionDetails sx={{ padding: '16px 0 0 0' }}>
          {ticketHistory?.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No history available for this ticket.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {sortedHistory.map((entry, index) => (
                <HistoryEntry
                  key={`${entry.revisionNumber}-${entry.fieldName}-${index}`}
                  entry={entry}
                />
              ))}
            </Stack>
          )}
        </AccordionDetails>
      </Accordion>
    </>
  );
}

interface ChangeRendererProps {
  item: TicketHistoryEntryDto;
}

function ChangeRenderer({ item }: ChangeRendererProps) {
  const oldEntity = useEntityByIdAndType(
    item.fieldName,
    item.oldValue?.entityId,
  );
  const newEntity = useEntityByIdAndType(
    item.fieldName,
    item.newValue?.entityId,
  );

  const renderEntity = (
    entity: State | PriorityBucket | LabelType | Iteration | undefined,
  ) => {
    switch (item.fieldName) {
      case 'label':
        return <LabelTypeItemDisplay labelType={entity as LabelType} />;
      case 'priority':
        return <PriorityItemDisplay localPriority={entity as PriorityBucket} />;
      case 'state':
        return <StateItemDisplay state={entity as State} />;
      case 'iteration':
        return <IterationItemDisplay iteration={entity as Iteration} />;
      case 'external_requestor':
        return (
          <ExternalRequestorItemDisplay
            externalRequestor={entity as ExternalRequestor}
          />
        );
    }
  };

  const fieldNameCapitalized = capitalize(item.fieldName);
  if (oldEntity && newEntity) {
    return (
      <Stack sx={{ flexDirection: 'row' }}>
        <Typography variant="caption">
          {fieldNameCapitalized} changed from {renderEntity(oldEntity)} to{' '}
          {renderEntity(newEntity)}{' '}
        </Typography>
      </Stack>
    );
  }
  if (!oldEntity && newEntity) {
    return (
      <Stack sx={{ flexDirection: 'row' }}>
        <Typography variant="caption">
          {fieldNameCapitalized} {renderEntity(newEntity)} added{' '}
        </Typography>
      </Stack>
    );
  }
  if (oldEntity && !newEntity) {
    return (
      <Stack sx={{ flexDirection: 'row' }}>
        <Typography variant="caption">
          {fieldNameCapitalized} {renderEntity(oldEntity)} removed{' '}
        </Typography>
      </Stack>
    );
  }
  // Handle text-based changes (like description, title, etc.)
  if (!oldEntity && !newEntity) {
    let oldValue = item.oldValue?.value || '';
    let newValue = item.newValue?.value || '';

    if (item.fieldName === 'additional_field') {
      // Format dates in both old and new values
      oldValue = formatAdditionalFieldValue(oldValue);
      newValue = formatAdditionalFieldValue(newValue);
    }

    // If both values are empty, something went wrong
    if (!oldValue && !newValue) {
      return (
        <Typography variant="caption" color="text.secondary">
          No changes detected
        </Typography>
      );
    }

    // If no old value but has new value - it's an addition
    if (!oldValue && newValue) {
      return (
        <Stack spacing={1}>
          <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
            {fieldNameCapitalized} added
          </Typography>
          <Box sx={{ maxWidth: 600 }}>
            <Box
              sx={{
                bgcolor: 'grey.100',
                border: '1px solid',
                borderColor: 'grey.300',
                borderRadius: 1,
                p: 1,
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  wordBreak: 'break-word',
                }}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(newValue),
                }}
              />
            </Box>
          </Box>
        </Stack>
      );
    }

    // If has old value but no new value - it's a deletion
    if (oldValue && !newValue) {
      return (
        <Stack spacing={1}>
          <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
            {fieldNameCapitalized} removed
          </Typography>
          <Box sx={{ maxWidth: 600 }}>
            <Box
              sx={{
                bgcolor: 'grey.100',
                border: '1px solid',
                borderColor: 'grey.300',
                borderRadius: 1,
                p: 1,
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  wordBreak: 'break-word',
                }}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(oldValue),
                }}
              />
            </Box>
          </Box>
        </Stack>
      );
    }

    // If both old and new values exist - it's an update
    return (
      <Stack spacing={1}>
        <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
          {fieldNameCapitalized} updated
        </Typography>
        <Stack spacing={1} sx={{ maxWidth: 600 }}>
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: 'block' }}
            >
              From:
            </Typography>
            <Box
              sx={{
                bgcolor: 'grey.100',
                border: '1px solid',
                borderColor: 'grey.300',
                borderRadius: 1,
                p: 1,
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  wordBreak: 'break-word',
                }}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(oldValue),
                }}
              />
            </Box>
          </Box>
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: 'block' }}
            >
              To:
            </Typography>
            <Box
              sx={{
                bgcolor: 'grey.100',
                border: '1px solid',
                borderColor: 'grey.300',
                borderRadius: 1,
                p: 1,
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  wordBreak: 'break-word',
                }}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(newValue),
                }}
              />
            </Box>
          </Box>
        </Stack>
      </Stack>
    );
  }

  return (
    <Typography variant="caption" color="error">
      Unable to render change
    </Typography>
  );
}

function useEntityByIdAndType(type: string, id: number | null | undefined) {
  const labels = useAllLabels();
  const iteration = useAllIterations();
  const states = useAllStates();
  const priorityBuckets = useAllPriorityBuckets();
  const externalRequestors = useAllExternalRequestors();
  if (!id) return undefined;
  switch (type) {
    case 'label':
      return labels.labels.find(label => label.id === id);
    case 'priority':
      return priorityBuckets.priorityBuckets.find(label => label.id === id);
    case 'state':
      return states.availableStates.find(label => label.id === id);
    case 'iteration':
      return iteration.iterations.find(label => label.id === id);
    case 'external_requestor':
      return externalRequestors.externalRequestors.find(er => er.id === id);
  }
}

// Simple text differ - splits by lines and shows additions/deletions
function getTextDiff(oldText: string | null, newText: string | null) {
  if (!oldText && !newText) return null;

  const oldLines = oldText ? oldText.split('\n') : [];
  const newLines = newText ? newText.split('\n') : [];

  // Simple line-based diff
  const maxLines = Math.max(oldLines.length, newLines.length);
  const changes = [];

  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine !== newLine) {
      if (oldLine && newLine) {
        // Modified line
        changes.push({
          type: 'modified',
          oldLine,
          newLine,
          lineNumber: i + 1,
        });
      } else if (oldLine && !newLine) {
        // Deleted line
        changes.push({
          type: 'deleted',
          oldLine,
          newLine: null,
          lineNumber: i + 1,
        });
      } else if (!oldLine && newLine) {
        // Added line
        changes.push({
          type: 'added',
          oldLine: null,
          newLine,
          lineNumber: i + 1,
        });
      }
    }
  }

  return changes;
}

// Strip HTML tags for cleaner display
function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

// Truncate long text for preview
function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

const formatAdditionalFieldValue = (value: string) => {
  if (!value) return value;

  // Check if the value contains a date pattern (ISO 8601 format)
  const dateRegex =
    /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?)/g;

  return value.replace(dateRegex, match => {
    try {
      const date = new Date(match);
      // Check if the date is valid
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
      return match; // Return original if invalid date
    } catch (error) {
      return match; // Return original if parsing fails
    }
  });
};
