import {
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import TitleIcon from '@mui/icons-material/Title';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import useTaskByKey from '../../../hooks/useTaskByKey';
import TaskDetailsActions from './TaskDetailsActions';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import TaskEditModal from './TaskEditModal';

function TaskDetails() {
  const task = useTaskByKey();
  const theme = useTheme();
  const description = `${task?.description?.replace(/<[^>]*>?/gm, ' ')}`;
  const [editModalOpen, setEditModalOpen] = useState(false);

  return (
    <>
      {task && (
        <TaskEditModal
          open={editModalOpen}
          handleClose={() => setEditModalOpen(false)}
          task={task}
        />
      )}
      <List>
        <ListItem
          secondaryAction={
            <IconButton
              edge="end"
              size="small"
              onClick={() => setEditModalOpen(true)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          }
        >
          <ListItemIcon sx={{ paddingRight: '1em' }}>
            <BadgeIcon sx={{ fill: theme.palette.primary[400] }} />
          </ListItemIcon>
          <ListItemText primary={`${task?.assignee.displayName}`} />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemIcon sx={{ paddingRight: '1em' }}>
            <TitleIcon sx={{ fill: theme.palette.primary[400] }} />
          </ListItemIcon>
          <ListItemText primary={`${task?.summary}`} />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemIcon sx={{ paddingRight: '1em' }}>
            <DescriptionIcon sx={{ fill: theme.palette.primary[400] }} />
          </ListItemIcon>
          <ListItemText
            primary={description !== 'undefined' ? description : ''}
          />
        </ListItem>
        <Divider />
      </List>
      <TaskDetailsActions />
    </>
  );
}

export default TaskDetails;
