import { Typography } from '@mui/material';
import { Box, Stack, SxProps } from '@mui/system';
import {
  GridToolbarQuickFilter,
  GridToolbarQuickFilterProps,
} from '@mui/x-data-grid';

/**
 * Defined once at module scope rather than inline in the JSX below.
 *
 * GridToolbarQuickFilter derives three things from this function's identity: `updateSearchValue`
 * (useCallback), the debounced updater built from it (useMemo), and the effect that syncs the
 * input back from the grid's quick filter model (it is in that effect's dependency array). A new
 * function on every render therefore rebuilds the pending debounce and re-runs the sync effect
 * continuously, so typed text can fail to reach the filter model and be overwritten from it.
 */
const quickFilterParser = (searchInput: string) =>
  searchInput
    .split(',')
    .map(value => value.trim())
    .filter(value => value !== '');

interface TableHeadersProps {
  tableName: string;
  showQuickFilter: boolean;
  quickFilterProps: GridToolbarQuickFilterProps;
}

export function TableHeaders({
  tableName,
  quickFilterProps,
}: TableHeadersProps) {
  return (
    <Stack direction={'row'} sx={{ padding: '1.5rem', alignItems: 'center' }}>
      <Typography
        variant="h1"
        sx={{ paddingRight: '1em', fontSize: '1.25rem' }}
      >
        {tableName}
      </Typography>
      <QuickSearchToolbar
        quickFilterProps={quickFilterProps}
        sx={{ marginLeft: 'auto' }}
      />
    </Stack>
  );
}

interface QuickSearchToolbarProps {
  quickFilterProps: GridToolbarQuickFilterProps;
  sx: SxProps;
}

function QuickSearchToolbar({ quickFilterProps, sx }: QuickSearchToolbarProps) {
  return (
    <Box
      sx={{
        p: 0.5,
        pb: 0,
        marginLeft: 'auto',
        ...sx,
      }}
    >
      <GridToolbarQuickFilter
        quickFilterParser={quickFilterParser}
        {...quickFilterProps}
      />
    </Box>
  );
}
