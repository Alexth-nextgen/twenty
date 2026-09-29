import { useLocation } from 'react-router-dom';
import { t } from '@lingui/core/macro';
import { IconAppWindow } from 'twenty-ui/icon';

import { NavigationDrawerItem } from '@/app/native-extension-host/api/modules/ui/navigation/navigation-drawer/components/NavigationDrawerItem';

export const HOST_SAMPLE_PATH = '/native-host-sample';

export const HostSampleNavigationItem = () => {
  const location = useLocation();

  return (
    <NavigationDrawerItem
      label={t`Native host sample`}
      Icon={IconAppWindow}
      to={HOST_SAMPLE_PATH}
      active={location.pathname === HOST_SAMPLE_PATH}
    />
  );
};
