import { PlusCircleOutlined } from '@ant-design/icons';
import { Button, Stack } from '@mui/material';

interface UserDefinedTableActionBarProps {
  editable: boolean;
  setEditable: (bool: boolean) => void;
}

export default function UserDefinedTableActionBar({
  editable,
  setEditable,
}: UserDefinedTableActionBarProps) {
  return (
    <>
      <Stack
        sx={{ width: '100%', padding: '0em 0em 1em 1em', flexDirection: 'row' }}
      >
        <Button
          variant="contained"
          color="success"
          startIcon={<PlusCircleOutlined />}
          sx={{ marginLeft: 'auto' }}
          onClick={() => setEditable(!editable)}
        >
          Edit Board
        </Button>
      </Stack>
    </>
  );
}
