import { useIsMobile } from 'twenty-ui/utilities';
import { INBOX_PATH } from '@/home/constants/InboxPath';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { useLingui } from '@lingui/react/macro';
import { useLocation } from 'react-router-dom';
import { IconInbox } from 'twenty-ui/icon';

export const NavigationDrawerInboxItem = () => {
  const { t } = useLingui();
  const location = useLocation();
  const isMobile = useIsMobile();

  if (isMobile) {
    return null;
  }

  return (
    <NavigationDrawerItem
      label={t`Inbox`}
      to={INBOX_PATH}
      Icon={IconInbox}
      active={location.pathname === INBOX_PATH}
    />
  );
};
