import { useState } from 'react';
import {
  Navbar,
  Center,
  Tooltip,
  UnstyledButton,
  createStyles,
  Stack,
  rem,
} from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import {
  IconHome2,
  IconLogout,
  IconClipboardTypography,
  Icon,
} from '@tabler/icons-react';

const useStyles = createStyles(theme => ({
  link: {
    width: rem(50),
    height: rem(50),
    borderRadius: theme.radius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color:
      theme.colorScheme === 'dark'
        ? theme.colors.dark[0]
        : theme.colors.gray[7],

    '&:hover': {
      backgroundColor:
        theme.colorScheme === 'dark'
          ? theme.colors.dark[5]
          : theme.colors.gray[0],
    },
  },

  active: {
    '&, &:hover': {
      backgroundColor: theme.fn.variant({
        variant: 'light',
        color: theme.primaryColor,
      }).background,
      color: theme.fn.variant({ variant: 'light', color: theme.primaryColor })
        .color,
    },
  },
}));

interface NavbarLinkProps {
  icon: React.FC<Icon>;
  link: string;
  label: string;
  active?: boolean;
  onClick?(): void;
}

function NavbarLink({
  icon: Icon,
  link,
  label,
  active,
  onClick,
}: NavbarLinkProps) {
  const { classes, cx } = useStyles();
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <Link to={link}>
        <UnstyledButton
          onClick={onClick}
          className={cx(classes.link, { [classes.active]: active })}
        >
          <Icon size="1.2rem" stroke={1.5} />
        </UnstyledButton>
      </Link>
    </Tooltip>
  );
}

const navLinksData = [
  { icon: IconHome2, label: 'Dashboard', link: '' },
  { icon: IconClipboardTypography, label: 'Tasks', link: 'tasks' },
];

export function NavBar() {
  const [active, setActive] = useState(2);
  const navigate = useNavigate();

  function handleLogout() {
    fetch('/api/auth/logout', { method: 'GET' }).then(res => {
      if (res.status === 200) {
        navigate('/');
      }
    }).catch( err => {
      // TODO: fix me, proper error handling
      console.log(err)
    });
  }

  const links = navLinksData.map((link, index) => (
    <NavbarLink
      {...link}
      key={link.label}
      active={index === active}
      link={link.link}
      onClick={() => setActive(index)}
    />
  ));

  return (
    <Navbar height={'100%'} width={{ base: 80 }} p="md">
      <Center>{/* <MantineLogo type="mark" size={30} /> */}</Center>
      <Navbar.Section grow mt={50}>
        <Stack justify="center" spacing={0}>
          {links}
        </Stack>
      </Navbar.Section>
      <Navbar.Section>
        <Stack justify="center" spacing={0}>
          <NavbarLink
            icon={IconLogout}
            label="Logout"
            link=""
            onClick={handleLogout}
          />
        </Stack>
      </Navbar.Section>
    </Navbar>
  );
}
