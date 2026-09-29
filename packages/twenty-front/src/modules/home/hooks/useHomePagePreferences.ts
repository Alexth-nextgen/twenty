import {
  type HomePagePreferences,
  homePagePreferencesState,
  normalizeHomePagePreferences,
} from '@/home/states/homePagePreferencesState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

/**
 * Home preferences are stored in localStorage and are not migrated between
 * builds, so a payload written by an older build can miss fields the current
 * build reads unconditionally. Every consumer reads them through this hook to
 * get the same complete shape instead of guarding each field on its own.
 */
export const useHomePagePreferences = (): HomePagePreferences => {
  const homePagePreferences = useAtomStateValue(homePagePreferencesState);

  return normalizeHomePagePreferences(homePagePreferences);
};
