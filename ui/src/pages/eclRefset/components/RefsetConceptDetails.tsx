import { Grid, Stack } from '@mui/material';
import RefsetDetailElement from './RefsetDetailElement.tsx';
import { Concept } from '../../../types/concept.ts';

interface RefsetConceptDetailsProps {
  concept: Concept;
}

function RefsetConceptDetails({ concept }: RefsetConceptDetailsProps) {
  return (
    <Grid container rowSpacing={1}>
      <Grid item mr={'3em'}>
        <Stack spacing={1}>
          <RefsetDetailElement label="Concept ID" value={concept.conceptId} />
        </Stack>
      </Grid>
      <Grid item mr={'3em'}>
        <Stack spacing={1}>
          <RefsetDetailElement
            label="Fully Specified Name"
            value={concept.fsn?.term}
          />
          <RefsetDetailElement
            label="Preferred Term"
            value={concept.pt?.term}
          />
        </Stack>
      </Grid>
      <Grid item mr={'3em'}>
        <Stack spacing={1}>
          <RefsetDetailElement label="Active" value={concept.active} />
          <RefsetDetailElement
            label="Primitive"
            value={concept.definitionStatus === 'PRIMITIVE'}
          />
        </Stack>
      </Grid>
      <Grid item>
        <Stack spacing={1}>
          <RefsetDetailElement
            label="Effective Time"
            value={concept.effectiveTime ?? undefined}
          />
          <RefsetDetailElement
            label="Module ID"
            value={concept.moduleId ?? undefined}
          />
        </Stack>
      </Grid>
    </Grid>
  );
}

export default RefsetConceptDetails;
