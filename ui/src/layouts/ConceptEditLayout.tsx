import { Grid } from '@mui/material';
import { useParams } from 'react-router-dom';

function ConceptEditLayout() {
  const { id } = useParams();
  return (
    <Grid
      container
      sx={{ minHeight: 'calc(100vh - 110px)', position: 'relative' }}
    >
      <h1> Concepts Model placeholder for {id}</h1>
    </Grid>
  );
}

export default ConceptEditLayout;
