import { Edge, Product } from '../../../types/concept.ts';
import { Grid } from '@mui/material';
import { Box, Stack } from '@mui/system';
import { ArrowBack, ArrowForward } from '@mui/icons-material';

export interface LinkViewsProps {
  links: Edge[];
  linkedConcept: Product;
  currentConcept: Product;
}

export default function LinkViews(props: LinkViewsProps) {
  const { links, linkedConcept, currentConcept } = props;
  return (
    <Grid style={{}}>
      <Box sx={{ fontSize: '0.9rem' }}>
        {links?.map((e, index) => {
          return (
            <Grid key={index}>
              <Stack direction="row" spacing={3}>
                <span>{e.label}</span>
                {e.source === currentConcept.concept.conceptId ? (
                  <ArrowForward />
                ) : (
                  <ArrowBack />
                )}
                <span>{linkedConcept.concept.fsn.term}</span>
              </Stack>
            </Grid>
          );
        })}
      </Box>
    </Grid>
  );
}
