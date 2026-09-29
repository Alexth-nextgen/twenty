import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  RECORD_LISTS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  RECORD_LISTS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: RECORD_LISTS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  name: 'Lists',
  icon: 'IconList',
  color: 'purple',
  position: 100,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: RECORD_LISTS_VIEW_UNIVERSAL_IDENTIFIER,
});
