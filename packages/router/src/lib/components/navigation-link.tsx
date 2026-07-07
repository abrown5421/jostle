import React, { MouseEvent, ReactNode } from 'react';
import { useNavigation } from '../navigation/use-navigation';

interface NavigationLinkProps {
  to?: string;
  pageKey?: string;
  params?: Record<string, string>; 
  children: ReactNode;
  className?: string;
  asButton?: boolean;
}

const NavigationLink: React.FC<NavigationLinkProps> = ({
  to,
  pageKey,
  params, 
  children,
  className = '',
  asButton = false,
}) => {
  const { navigate, navigateToKey, getPageByKey } = useNavigation();

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    if (pageKey) {
      navigateToKey(pageKey, params);
    } else if (to) {
      navigate(to);
    }
  };
  
  const resolvedHref = (() => {
    if (to) return to;
    if (pageKey) {
      const page = getPageByKey(pageKey);
      if (!page) return '#';
      if (!params) return page.path;
      return page.path.replace(/:([^/]+)/g, (_, token) => params[token] ?? `:${token}`);
    }
    return '#';
  })();

  const sharedProps = { onClick: handleClick, className };

  if (asButton) {
    return <button type="button" {...sharedProps}>{children}</button>;
  }

  return (
    <a href={resolvedHref} {...sharedProps}>
      {children}
    </a>
  );
};

export default NavigationLink;