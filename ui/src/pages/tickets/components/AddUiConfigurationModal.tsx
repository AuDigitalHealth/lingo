import { useEffect, useState } from 'react';
import useTicketStore from '../../../stores/TicketStore';
import { useCreateUiSearchConfiguration } from '../../../hooks/api/tickets/useUiSearchConfiguration';
import { useQueryClient } from '@tanstack/react-query';
import BaseModal from '../../../components/modal/BaseModal';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';
import { Button, MenuItem, Select, Stack } from '@mui/material';
import BaseModalFooter from '../../../components/modal/BaseModalFooter';

interface AddUiConfigurationModalProps {
  open: boolean;
  handleClose: () => void;
  quadrant: number | undefined;
}
export default function AddUiConfigurationModal({
  open,
  handleClose,
  quadrant,
}: AddUiConfigurationModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('');

  const { ticketFilters } = useTicketStore();

  const mutation = useCreateUiSearchConfiguration();
  const { data, isLoading, isError } = mutation;
  const queryClient = useQueryClient();

  const handleSubmit = () => {
    const foundFilter = ticketFilters.find(filter => {
      return filter.name === selectedFilter;
    });
    if (foundFilter === undefined) return;
    mutation.mutate({
      name: foundFilter.name,
      grouping: quadrant as number,
      filter: foundFilter,
    });
  };

  useEffect(() => {
    if (data) {
      void queryClient.invalidateQueries({
        queryKey: ['ui-search-configuration'],
      });
      handleClose();
    }
    // eslint-disable-next-line
  }, [data, isLoading, isError]);

  return (
    <BaseModal open={open} handleClose={handleClose}>
      <BaseModalHeader title="Add a table from a filter" />
      <BaseModalBody>
        <Select
          value={selectedFilter || ''}
          onChange={e => setSelectedFilter(e.target.value)}
          sx={{ width: '100%' }}
        >
          {ticketFilters.map((filter, index) => (
            <MenuItem key={index} value={filter.name}>
              {filter.name}
            </MenuItem>
          ))}
        </Select>
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <>
            <Stack sx={{ gap: 1, flexDirection: 'row' }}>
              <Button
                color="primary"
                size="small"
                variant="contained"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                color="success"
                size="small"
                variant="contained"
                onClick={handleSubmit}
                disabled={!selectedFilter}
              >
                Add Filter
              </Button>
            </Stack>
          </>
        }
      />
    </BaseModal>
  );
}
