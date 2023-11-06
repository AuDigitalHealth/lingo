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
  Tooltip,
} from '@mui/material';
import TicketsService from '../../../api/TicketsService';
import useTicketStore from '../../../stores/TicketStore';
import { getIterationValue } from '../../../utils/helpers/tickets/ticketFields';
import { useSnackbar } from 'notistack';
import Loading from '../../../components/Loading';

interface ExportModalProps {
  open: boolean;
  handleClose: () => void;
  title: string;
}
export default function ExportModal({
  open,
  handleClose,
  title,
}: ExportModalProps) {
  const { iterations } = useTicketStore();
  const [selectedIteration, setSelectedIteration] = useState<
    Iteration | undefined
  >();
  const [loading, setLoading] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  const handleSelectedIterationChange = (event: SelectChangeEvent) => {
    const newIteration = getIterationValue(event.target.value, iterations);
    setSelectedIteration(newIteration);
  };

  const handleSubmit = () => {
    if (selectedIteration) {
      setLoading(true);

      TicketsService.generateExport(selectedIteration.id)
        .catch(error => {
          enqueueSnackbar(`Error downloading report: ${error}`, {
            variant: 'error',
          });
        })
        .finally(() => {
          setLoading(false);
          handleClose();
        });
    }
  };
  return (
    <BaseModal
      open={open}
      handleClose={!loading ? handleClose : () => null}
      sx={{ minWidth: '400px' }}
    >
      <BaseModalHeader title={title} />
      <BaseModalBody>
        {loading ? (
          <Loading />
        ) : (
          <Select
            value={selectedIteration?.name ? selectedIteration?.name : ''}
            onChange={handleSelectedIterationChange}
            sx={{ width: '100%', maxWidth: '200px' }}
            input={<Select />}
            disabled={loading}
          >
            {iterations.map(iterationLocal => (
              <MenuItem
                key={iterationLocal.id}
                value={iterationLocal.name}
                onKeyDown={e => e.stopPropagation()}
              >
                <Tooltip title={iterationLocal.name} key={iterationLocal.id}>
                  <Chip
                    color={'warning'}
                    label={iterationLocal.name}
                    size="small"
                    sx={{ color: 'black' }}
                  />
                </Tooltip>
              </MenuItem>
            ))}
          </Select>
        )}
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Button
            color="primary"
            size="small"
            variant="contained"
            onClick={handleSubmit}
            disabled={!selectedIteration || loading}
          >
            Generate Report
          </Button>
        }
      />
    </BaseModal>
  );
}
