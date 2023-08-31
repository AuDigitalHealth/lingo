import { CSSObject } from "@emotion/styled";
import { Typography } from "@mui/material";
import { Box, Stack } from "@mui/system";
import { GridToolbarQuickFilter, GridToolbarQuickFilterProps } from "@mui/x-data-grid";

interface TableHeadersProps {
    tableName: string;
    showQuickFilter: boolean;
    quickFilterProps: GridToolbarQuickFilterProps;
  }
  
  export function TableHeaders({ tableName }: TableHeadersProps) {
    return (
      <Stack direction={'row'} sx={{ padding: '1.5rem', alignItems: 'center' }}>
        <Typography
          variant="h1"
          sx={{ paddingRight: '1em', fontSize: '1.25rem' }}
        >
          {tableName}
        </Typography>
        <QuickSearchToolbar sx={{ marginLeft: 'auto' }} />
      </Stack>
    );
  }
  
  function QuickSearchToolbar(sx: CSSObject) {
    return (
      <Box
        sx={{
          p: 0.5,
          pb: 0,
          marginLeft: 'auto',
        }}
      >
        <GridToolbarQuickFilter
          quickFilterParser={(searchInput: string) =>
            searchInput
              .split(',')
              .map(value => value.trim())
              .filter(value => value !== '')
          }
        />
      </Box>
    );
  }