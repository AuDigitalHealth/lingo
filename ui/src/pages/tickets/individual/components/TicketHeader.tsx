import { Stack } from "@mui/system";
import { Ticket } from "../../../../types/tickets/ticket";
import GravatarWithTooltip from "../../../../components/GravatarWithTooltip";
import useJiraUserStore from "../../../../stores/JiraUserStore";
import { Button, Typography } from "@mui/material";


interface TicketHeaderProps {
    ticket?: Ticket;
}
export default function TicketHeader({ticket} : TicketHeaderProps){

    const { jiraUsers } = useJiraUserStore();
    return (
        <>
        <Stack direction="row" width="100%">
          <div
            style={{
              width: '10%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <GravatarWithTooltip
              useFallback={true}
              username={ticket?.assignee}
              userList={jiraUsers}
              size={40}
            />
            <Typography variant="caption" fontWeight="bold">
              Assignee
            </Typography>
          </div>
          <Typography variant="h2" sx={{ width: '70%' }}>
            {ticket?.title}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            sx={{ height: '35px', marginLeft: 'auto' }}
          >
            Edit
          </Button>
        </Stack>
        <Stack direction="row" width="100%" paddingTop="1em">
          <Typography variant="body1">Created by</Typography>
          <GravatarWithTooltip
            sx={{ paddingLeft: '0.5em', paddingRight: '0.5em' }}
            username={ticket?.createdBy}
            userList={jiraUsers}
            size={20}
          />
          <Typography variant="body1">
            on {new Date(ticket?.created || 0).toLocaleDateString()}
          </Typography>
        </Stack>
        </>
    )
}