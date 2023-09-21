// material-ui
import { FileAddOutlined } from '@ant-design/icons';
import { Stack } from '@mui/material';

// assets
import { DropzopType } from '../../../../../types/tickets/dropzone';

// ==============================|| UPLOAD - PLACEHOLDER ||============================== //

export default function PlaceholderContent({ type }: { type?: string }) {
  return (
    <>
      
      {type === DropzopType.standard && (
        <Stack alignItems="center" justifyContent="center" sx={{ height: 1 }}>
          <FileAddOutlined style={{ fontSize: '32px' }} />
        </Stack>
      )}
    </>
  );
}
