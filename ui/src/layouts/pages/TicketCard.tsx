import { Typography, Tooltip } from '@mui/material';

import { Ticket } from '../../types/tickets/ticket';
import { Stack } from '@mui/system';

import { ClusterOutlined } from '@ant-design/icons';

import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import Draggable from './Draggable';

interface TicketCardProps {
  ticket: Ticket;
}

export const TicketCard = ({ ticket }: TicketCardProps) => {
  const theme = useTheme();
  const handleTicketClick = (
    event:
      | React.MouseEvent<HTMLSpanElement>
      | React.MouseEvent<HTMLDivElement, MouseEvent>
      | undefined,
    id: number,
  ) => {
    console.log('called click event');
    console.log(event);
    console.log(id);
  };

  return (
    <Draggable id={ticket.id} sx={{ width: '100%' }}>
      <Stack direction="column">
        <Typography
          onClick={event => handleTicketClick(event, ticket.id)}
          variant="subtitle1"
          sx={{
            display: 'inline-block',
            width: 'calc(100%)',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            verticalAlign: 'middle',
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          {ticket.title}
        </Typography>
        {true && (
          <>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Tooltip title="User Story">
                <ClusterOutlined
                  style={{
                    color: theme.palette.primary.dark,
                    fontSize: '0.75rem',
                  }}
                />
              </Tooltip>
              <Tooltip title={'Task title in ms'}>
                <Link to={'/'} style={{ textDecoration: 'none' }}>
                  <Typography
                    color={'primary.dark'}
                    variant="subtitle1"
                    sx={{
                      fontSize: '0.75rem',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    Task # AU-82
                  </Typography>
                </Link>
              </Tooltip>
            </Stack>
          </>
        )}
      </Stack>
    </Draggable>
  );
};
