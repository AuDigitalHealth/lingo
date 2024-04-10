import { Breadcrumbs, Typography } from '@mui/material';
import { styled } from '@mui/system';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  title: string;
  path: string;
}

interface PageBreadcrumbsProps {
  breadcrumbs: BreadcrumbItem[];
}

const StyledLink = styled(Link)({
  color: 'inherit',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
});

function PageBreadcrumbs({ breadcrumbs }: PageBreadcrumbsProps) {
  return (
    <Breadcrumbs sx={{ color: 'inherit' }}>
      {breadcrumbs.map((item, ind, arr) =>
        ind !== arr.length - 1 ? (
          <StyledLink to={item.path} key={item.path}>
            {item.title}
          </StyledLink>
        ) : (
          <Typography color="text.primary" key={item.path}>
            {item.title}
          </Typography>
        ),
      )}
    </Breadcrumbs>
  );
}

export default PageBreadcrumbs;
