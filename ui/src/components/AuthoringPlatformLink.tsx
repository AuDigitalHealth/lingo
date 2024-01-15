import React, { ForwardedRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useServiceStatus } from '../hooks/api/useServiceStatus';
import { unavailableErrorHandler } from '../types/ErrorHandler';
import { LinkTarget } from '../types/menu';

export interface AuthoringPlatformLinkProps {
  to: string;
  children?: React.ReactNode;
  target?: LinkTarget;
  ref?: ForwardedRef<HTMLAnchorElement>;
  // props?: RefAttributes<HTMLAnchorElement>;
  ariaLabel?: string | undefined;
  [key: string]: any; // Allow any additional props
}

const AuthoringPlatformLink: React.FC<AuthoringPlatformLinkProps> = props => {
  const { to, children, target, ref, ariaLabel, onClick, ...rest } = props;
  const navigate = useNavigate();
  const { serviceStatus } = useServiceStatus();

  const handleLinkClick = (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) => {
    if (serviceStatus?.authoringPlatform.running) {
      navigate(to);
    } else {
      unavailableErrorHandler('', 'Authoring Platform');
      event.preventDefault();
    }
  };

  return (
    <Link
      to={to}
      onClick={handleLinkClick}
      ref={ref}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </Link>
  );
};

export default AuthoringPlatformLink;
