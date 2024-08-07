import { Typography } from '@mui/material';
import { Box, Stack, SxProps } from '@mui/system';
import {
  GridToolbarQuickFilter,
  GridToolbarQuickFilterProps,
} from '@mui/x-data-grid';

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
        quickFilterParser={(searchInput: string) =>
          searchInput
            .split(',')
            .map(value => value.trim())
            .filter(value => value !== '')
        }
        {...quickFilterProps}
      />
    </Box>
  );
}
