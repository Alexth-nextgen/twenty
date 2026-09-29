import { type NativeAppDefinition } from '@/app/native-extension-host/types/NativeAppDefinition';
import {
  findNativeAppCommand,
  getNativeAppNavigationEntries,
  getNativeAppRecordSections,
  getNativeAppRoutePaths,
  isNativeApplicationEnabled,
} from '@/app/native-extension-host/utils/nativeAppRegistry';

const load = async () => ({ default: () => null });

const firstApplication: NativeAppDefinition = {
  universalIdentifier: 'application-a',
  version: '1.0.0',
  routes: [{ path: '/a', load }],
  navigation: [
    { id: 'late', position: 200, load },
    { id: 'early', position: 100, load },
  ],
  recordSections: [
    {
      id: 'a-section',
      position: 100,
      objectNames: ['person'],
      load,
    },
  ],
  commands: [{ key: 'A_COMMAND', load }],
};

const secondApplication: NativeAppDefinition = {
  universalIdentifier: 'application-b',
  version: '2.0.0',
  routes: [{ path: '/b', load }],
  navigation: [{ id: 'early', position: 100, load }],
  recordSections: [
    { id: 'b-section', position: 100, objectNames: ['company'], load },
  ],
  commands: [{ key: 'B_COMMAND', load }],
};

const definitions = [firstApplication, secondApplication];

describe('native app registry', () => {
  it('sorts navigation entries by position and then by identifier', () => {
    expect(
      getNativeAppNavigationEntries(definitions).map(
        ({ id, applicationId }) => [applicationId, id],
      ),
    ).toEqual([
      ['application-a', 'early'],
      ['application-b', 'early'],
      ['application-a', 'late'],
    ]);
  });

  it('keeps record sections scoped to their declared objects', () => {
    expect(
      getNativeAppRecordSections(definitions).map(
        ({ id, objectNames, applicationId }) => ({
          id,
          objectNames,
          applicationId,
        }),
      ),
    ).toEqual([
      {
        id: 'a-section',
        objectNames: ['person'],
        applicationId: 'application-a',
      },
      {
        id: 'b-section',
        objectNames: ['company'],
        applicationId: 'application-b',
      },
    ]);
  });

  it('resolves a command to the application that registered it', () => {
    expect(findNativeAppCommand('B_COMMAND', definitions)?.applicationId).toBe(
      'application-b',
    );
    expect(
      findNativeAppCommand('UNKNOWN_COMMAND', definitions),
    ).toBeUndefined();
  });

  it('exposes every registered route path', () => {
    expect(getNativeAppRoutePaths(definitions)).toEqual(['/a', '/b']);
  });

  it('only treats installed and enabled applications as active', () => {
    const applications = [
      { universalIdentifier: 'application-a', isEnabled: true },
      { universalIdentifier: 'application-b', isEnabled: false },
    ];

    expect(
      isNativeApplicationEnabled({
        applications,
        applicationId: 'application-a',
      }),
    ).toBe(true);
    expect(
      isNativeApplicationEnabled({
        applications,
        applicationId: 'application-b',
      }),
    ).toBe(false);
    expect(
      isNativeApplicationEnabled({
        applications,
        applicationId: 'application-c',
      }),
    ).toBe(false);
    expect(
      isNativeApplicationEnabled({
        applications: [],
        applicationId: 'application-a',
      }),
    ).toBe(false);
  });

  it('drops every registration when an application is removed from the registry', () => {
    expect(getNativeAppNavigationEntries([secondApplication])).toHaveLength(1);
    expect(
      findNativeAppCommand('A_COMMAND', [secondApplication]),
    ).toBeUndefined();
    expect(getNativeAppRoutePaths([secondApplication])).toEqual(['/b']);
  });
});
