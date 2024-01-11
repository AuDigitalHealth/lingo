import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useApplicationConfigStore from '../stores/ApplicationConfigStore';

interface SnowstormLinkProps {
    to: string;
    children: React.ReactNode;
    [key: string]: any; // Allow any additional props
  }
  
  const SnowstormLink: React.FC<SnowstormLinkProps> = ({ to, children, props }) => {
    const [canRedirect, setCanRedirect] = useState<boolean>(false);
    const navigate = useNavigate();
    const applicationConfig = useApplicationConfigStore().applicationConfig;
  
    const handleClick = async () => {
      try {
        // Your API call logic goes here
        const response = await fetch(applicationConfig?.apUrl);
        if (response.ok) {
          setCanRedirect(true);
        } else {
          console.error('API call failed');
        }
      } catch (error) {
        console.error('Error during API call:', error);
      }
    };
  
    const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      if (!canRedirect) {
        event.preventDefault();
        handleClick();
      }
      // If canRedirect is true, the link will naturally navigate
    };
  
    return (
      <Link to={to} onClick={handleLinkClick} {...props}>
        {children}
      </Link>
    );
  };


export default SnowstormLink;