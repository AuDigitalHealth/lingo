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
function TaskDetails() {
  const task = useTaskById();
  return (
    <>
      <List>
        <ListItem>
          <ListItemIcon>
            <BadgeIcon />
          </ListItemIcon>
          <ListItemText primary={`${task?.assignee.displayName}`} />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemIcon>
            <TitleIcon />
          </ListItemIcon>
          <ListItemText primary={`${task?.summary}`} />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemIcon>
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
