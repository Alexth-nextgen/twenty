import { type Repository } from 'typeorm';
import { NativeAppHostService } from '../native-app-host.service';
import { type ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { type KeyValuePairEntity } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { type WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

jest.mock('src/native-apps/manifests', () => ({
  NATIVE_APP_MANIFESTS: [
    {
      universalIdentifier: 'test-app',
      displayName: 'Independent app',
      version: '1.0.0',
      hostCapability: 'native-app-host@1',
    },
  ],
}));

describe('Native app host isolation and lifecycle', () => {
  const findApplication = jest.fn();
  const findSetting = jest.fn();
  const transaction = jest.fn();
  const invalidateAndRecompute = jest.fn();
  const host = new NativeAppHostService(
    {
      findOneBy: findApplication,
      manager: { transaction },
    } as unknown as Repository<ApplicationEntity>,
    { findOneBy: findSetting } as unknown as Repository<KeyValuePairEntity>,
    { invalidateAndRecompute } as unknown as WorkspaceCacheService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    findApplication.mockResolvedValue(null);
    findSetting.mockResolvedValue(null);
  });

  it('denies a workspace without an installation', async () => {
    await expect(host.assertEnabled('workspace-a', 'test-app')).rejects.toThrow(
      'NATIVE_APP_DISABLED',
    );
    expect(findSetting).not.toHaveBeenCalled();
  });

  it('fails closed when an application row has no enabled state', async () => {
    findApplication.mockResolvedValue({ id: 'application-a' });
    await expect(host.isEnabled('workspace-a', 'test-app')).resolves.toBe(
      false,
    );
  });

  it('checks both application and activation in the requested workspace', async () => {
    findApplication.mockResolvedValue({ id: 'application-a' });
    findSetting.mockResolvedValue({ value: 'enabled' });
    await expect(host.isEnabled('workspace-b', 'test-app')).resolves.toBe(true);
    expect(findApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-b',
        universalIdentifier: 'test-app',
      }),
    );
    expect(findSetting).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-b',
        key: 'native-app:test-app:state',
      }),
    );
  });

  it('rejects unknown packages before modifying installation state', async () => {
    await expect(
      host.manage('workspace-a', 'unknown-app', 'install'),
    ).rejects.toThrow('NATIVE_APP_CAPABILITY_UNSUPPORTED');
    expect(transaction).not.toHaveBeenCalled();
  });

  it('uninstall changes activation without deleting the application or its data', async () => {
    const save = jest.fn(async (value) => value);
    const repository = {
      findOneBy: jest.fn().mockResolvedValue({ id: 'existing' }),
      create: (value: unknown) => value,
      save,
    };
    transaction.mockImplementation(async (callback) =>
      callback({ query: jest.fn(), getRepository: () => repository }),
    );
    await host.manage('workspace-a', 'test-app', 'uninstall');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 'disabled',
        key: 'native-app:test-app:state',
      }),
    );
    expect(invalidateAndRecompute).toHaveBeenCalledWith('workspace-a', [
      'flatApplicationMaps',
    ]);
  });
});
