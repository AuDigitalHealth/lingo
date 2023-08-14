import {
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import TitleIcon from '@mui/icons-material/Title';
import DescriptionIcon from '@mui/icons-material/Description';
import useTaskById from '../../hooks/useTaskById';
import TaskDetailsActions from './TaskDetailsActions';
import { useTheme } from '@emotion/react';
function TaskDetails() {
  const task = useTaskById();
  const theme = useTheme();
  return (
    <>
      <List>
        <ListItem>
          <ListItemIcon sx={{ paddingRight: '1em' }}>
            <BadgeIcon />
          </ListItemIcon>
          <ListItemText primary={`${task?.assignee.displayName}`} />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemIcon sx={{ paddingRight: '1em' }}>
            <TitleIcon />
          </ListItemIcon>
          <ListItemText primary={`${task?.summary}`} />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemIcon sx={{ paddingRight: '1em' }}>
            <DescriptionIcon />
          </ListItemIcon>
          <ListItemText
            primary={`${task?.description
              ?.replace('<p>', '')
              ?.replace('</p>', '')}`}
          />
        </ListItem>
        <Divider />
      </List>
      <TaskDetailsActions />
    </>
  );
}

export default TaskDetails;
