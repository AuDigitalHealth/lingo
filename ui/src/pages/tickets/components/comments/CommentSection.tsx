import { Stack } from "@mui/system";
import CommentView from "./Comment";
import { Ticket } from "../../../../types/tickets/ticket";
// import CommentAuthoror from "./CommentAuthoror";
import CommentEditor from "./CommentEditor";
import { Typography } from "@mui/material";

interface CommentSectionProps {
    ticket?: Ticket;
}
export default function CommentSection({ticket} : CommentSectionProps){

    if(ticket === undefined) return (<></>);
    return (
        <Stack direction="column" width="100%" marginTop='0.5em'>
          <Typography variant='caption' fontWeight='bold' textAlign='left' width='100%'>
            Comments:
          </Typography>
          {ticket?.comments?.map((comment => (
            <CommentView comment={comment} key={comment.id}/>
          )))}
          <CommentEditor ticket={ticket}/>
        </Stack>
    )
}