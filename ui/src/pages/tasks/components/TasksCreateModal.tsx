import { useState } from 'react';
import BaseModal from '../../../components/modal/BaseModal';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';
import { Iteration } from '../../../types/tickets/ticket';
import BaseModalFooter from '../../../components/modal/BaseModalFooter';
import {
  Button,
  Chip,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Tooltip,
} from '@mui/material';
import TicketsService from '../../../api/TicketsService';
import useTicketStore from '../../../stores/TicketStore';
import { getIterationValue } from '../../../utils/helpers/tickets/ticketFields';
import { useSnackbar } from 'notistack';
import Loading from '../../../components/Loading';
import { Stack } from '@mui/system';

import { useForm } from "react-hook-form";


interface TasksCreateModalProps {
  open: boolean;
  handleClose: () => void;
  title: string;
}
export default function TasksCreateModal({
  open,
  handleClose,
  title,
}: TasksCreateModalProps) {

  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, control, setValue } = useForm();

  const { enqueueSnackbar } = useSnackbar();

  const handleAttemptSubmit = () => {
    
  };
  return (
    <BaseModal
      open={open}
      handleClose={!loading ? handleClose : () => null}
      sx={{ minWidth: '800px' }}
    >
      <BaseModalHeader title={title} />
      <BaseModalBody>
        <TextField label="Title" type="text"/>
        <Select label="Project"/>

      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
            <Stack flexDirection={'row'} gap={1}>
          <Button
            color="primary"
            size="small"
            variant="contained"
            onClick={handleAttemptSubmit}
            disabled={loading}
          >
            Create Task
          </Button>
          <Button
            color="error"
            size="small"
            variant="contained"
            onClick={handleAttemptSubmit}
            disabled={loading}
          >
            Cancel
          </Button>
          </Stack>
        }
      />
    </BaseModal>
  );
}


