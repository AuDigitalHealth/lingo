import { useParams } from 'react-router-dom';
import useTicketById from '../../hooks/useTicketById';
import { Stack, minWidth, width } from '@mui/system';
import MainCard from '../../components/MainCard';
import { Button, Card, Divider, Typography } from '@mui/material';
import useTicketStore from '../../stores/TicketStore';
import LabelChip from './components/LabelChip';
import { LabelBasic } from '../../types/tickets/ticket';
import GravatarWithTooltip from '../../components/GravatarWithTooltip';
import useJiraUserStore from '../../stores/JiraUserStore';
import ResizableTextArea from './components/ResizableTextArea';
import UneditableTextArea from './components/UneditableTextArea';
import getAdditionalFieldTypeByValue from '../../utils/helpers/tickets/additionalFieldUtils';
import CommentView from './components/comments/Comment';
import CommentSection from './components/comments/CommentSection';
import Description from './Description';

function IndividualTicket() {
  const { id } = useParams();
  const ticket = useTicketById(id);
  const { labelTypes, additionalFieldTypes } = useTicketStore();
  const {jiraUsers} = useJiraUserStore();

  const createLabelBasic = (name: string, id: number) : LabelBasic => {
    return {
      labelTypeId: id.toString(),
      labelTypeName: name
    }
  };
  
  return (
    <Stack direction="row" width="100%" justifyContent="center" height="100%" >
      <Card
        sx={{
          minWidth: '800px',
          maxWidth: '1200px',
          height: '100%',
          padding: '2em',
          overflow:'scroll'
        }}
      >
        <Stack direction="row" width="100%">
          <div style={{width: '10%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <GravatarWithTooltip 
            useFallback={true}
            username={ticket?.assignee}
            userList={jiraUsers}
            size={40}
            />
            <Typography variant='caption' fontWeight='bold'>
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
        <Stack direction='row' width='100%' paddingTop='1em'>
          <Typography variant='body1'>
            Created by 
          </Typography>
          <GravatarWithTooltip 
            sx={{paddingLeft: '0.5em', paddingRight: '0.5em'}}
            username={ticket?.createdBy}
            userList={jiraUsers}
            size={20}
            
            />
            <Typography variant='body1'>
              on {new Date(ticket?.created || 0).toLocaleDateString()}
            </Typography>
        </Stack>
        <Divider  sx={{marginTop: '1.5em', marginBottom: '1.5em'}}/>
        <Stack direction="row" width="100%" alignItems='center'>
          <Typography variant='caption' fontWeight='bold'>
            Labels:
          </Typography>
          {ticket?.labels.map(label => { 
            const labelVal = createLabelBasic(label.name, label.id);
            return (
              <div style={{marginLeft: '1em'}}>
                <LabelChip
                  labelTypeList={labelTypes}
                  labelVal={labelVal}
                />
              </div>
            
          )})}
        </Stack>
        <Stack direction="row" width="100%" alignItems='center' marginTop='0.5em'>
          <Typography variant='caption' fontWeight='bold'>
            Additional Fields:
          </Typography>
          {ticket?.additionalFieldTypeValues?.map((item, index) => {
            let type = getAdditionalFieldTypeByValue(item, additionalFieldTypes);
            const length = ticket?.additionalFieldTypeValues?.length || 0;
            const seperator = index !== length -1 ? ',   ' : ' ';
            return (
            <Typography variant='body1'>
              {' ' + type?.name + ': ' + item.valueOf + seperator}
            </Typography>
            )
          })}
        </Stack>
        <Stack direction="row" width="100%" alignItems='center' marginTop='0.5em'>
          <Typography variant='caption' fontWeight='bold'>
            Iteration: 
          </Typography>
          <Typography variant='body1'>
            {ticket?.iteration.name}
          </Typography>
        </Stack>
        <Stack direction="row" width="100%" alignItems='center' marginTop='0.5em'>
          <Typography variant='caption' fontWeight='bold'>
            State: 
          </Typography>
          <Typography variant='body1'>
            {ticket?.state.label}
          </Typography>
        </Stack>
        <Divider  sx={{marginTop: '1.5em', marginBottom: '1.5em'}}/>
        <Description description={ticket?.description}/>
        <CommentSection ticket={ticket}/>
      </Card>
    </Stack>
  );
}

export default IndividualTicket;
