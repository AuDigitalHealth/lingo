import { Task } from '../types/task';
import { Card, Group, Text, Badge, ActionIcon, Anchor } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

interface TaskProps {
  task: Task;
}

function TaskItem({ task }: TaskProps): JSX.Element {
  return (
    <div style={{ width: '300px', height: '300px' }}>
      <Card withBorder padding="lg" radius="md">
        <Group position="apart">
          <Badge>{task.status}</Badge>
        </Group>
        <Link to={`/dashboard/tasks/edit/${task.key}`}>
          <Text fz="lg" fw={500} mt="md">
            {task.summary}
          </Text>
        </Link>
        <Text fz="sm" c="dimmed" mt={5}>
          {task.description?.replace(/<[^>]*>?/gm, '')}
        </Text>
        <Group position="apart" mt="md">
          <Anchor
            href={`${import.meta.env.VITE_AP_URL}/#/tasks/task/${
              task.projectKey
            }/${task.key}/edit`}
            target="_blank"
          >
            <ActionIcon variant="default">
              <IconExternalLink size="1.1rem" />
            </ActionIcon>
          </Anchor>
        </Group>
      </Card>
    </div>
  );
}

export default TaskItem;
