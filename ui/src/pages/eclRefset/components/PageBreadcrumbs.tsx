import { Breadcrumbs, Link, Typography } from '@mui/material';
import AuthoringPlatformLink from '../../../components/AuthoringPlatformLink';
import { styled } from '@mui/system';

interface BreadcrumbItem {
  title: string;
  path: string;
}

interface PageBreadcrumbsProps {
  breadcrumbs: BreadcrumbItem[];
}

const StyledLink = styled(AuthoringPlatformLink)({
  color: "inherit",
  textDecoration: "none",
  "&:hover": {
    textDecoration: "underline"
  }
})

function PageBreadcrumbs({breadcrumbs}: PageBreadcrumbsProps) {

  return (
    <Breadcrumbs sx={{color: "inherit"}}>
      { 
        breadcrumbs.map((item, ind, arr) => ind !== arr.length - 1 ? 
          <StyledLink to={item.path}>{item.title}</StyledLink> 
          : <Typography color="text.primary">{item.title}</Typography>)
      }
    </Breadcrumbs>
  );
}

export default PageBreadcrumbs;
