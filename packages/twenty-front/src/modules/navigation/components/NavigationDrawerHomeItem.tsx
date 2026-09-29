import { useIsMobile } from 'twenty-ui/utilities';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { useLingui } from '@lingui/react/macro';
import { useLocation } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { IconHome } from 'twenty-ui/icon';

export const NavigationDrawerHomeItem = () => {
  const { t } = useLingui();
  const location = useLocation();
  const isMobile = useIsMobile();

  if (isMobile) {
    return null;
  }

  return (
    <NavigationDrawerItem
      label={t`Home`}
      to={AppPath.Home}
      Icon={IconHome}
      active={location.pathname === AppPath.Home}
    />
  );
};
