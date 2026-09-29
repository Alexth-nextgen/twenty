import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, type EntityManager } from 'typeorm';
import { CommandMenuItemAvailabilityType } from 'twenty-shared/types';

import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { ApplicationState } from 'src/engine/core-modules/application/enums/application-state.enum';
import { ApplicationRegistrationSourceType } from 'src/engine/core-modules/application/application-registration/enums/application-registration-source-type.enum';
import {
  KeyValuePairEntity,
  KeyValuePairType,
} from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { NATIVE_APP_MANIFESTS } from 'src/native-apps/manifests';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { CommandMenuItemEntity } from 'src/engine/metadata-modules/command-menu-item/entities/command-menu-item.entity';
import { EngineComponentKey } from 'src/engine/metadata-modules/command-menu-item/enums/engine-component-key.enum';
import {
  NATIVE_APP_HOST_CAPABILITY_NAME,
  NATIVE_APP_HOST_SUPPORTED_RANGE,
  checkNativeAppHostCapability,
} from 'src/engine/core-modules/application/native-extension-host/utils/native-app-host-capability.util';

export const NATIVE_APP_HOST_CAPABILITY = `${NATIVE_APP_HOST_CAPABILITY_NAME}@${NATIVE_APP_HOST_SUPPORTED_RANGE}`;
export type NativeAppAction =
  | 'install'
  | 'enable'
  | 'disable'
  | 'uninstall'
  | 'upgrade';
export type NativeAppResource = { kind: string; id: string };
type ResourceInventory = (
  workspaceId: string,
  manager: EntityManager,
) => Promise<NativeAppResource[]>;

@Injectable()
export class NativeAppHostService {
  private readonly resourceInventories = new Map<string, ResourceInventory>();

  registerResourceInventory(
    applicationId: string,
    inventory: ResourceInventory,
  ) {
    this.resourceInventories.set(applicationId, inventory);
  }

  async inspectResources(workspaceId: string, universalIdentifier: string) {
    const inventory = this.resourceInventories.get(universalIdentifier);
    if (!inventory) throw new BadRequestException('NATIVE_APP_NOT_REGISTERED');
    return inventory(workspaceId, this.applications.manager);
  }

  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
    @InjectRepository(KeyValuePairEntity)
    private readonly settings: Repository<KeyValuePairEntity>,
    private readonly workspaceCache: WorkspaceCacheService,
  ) {}

  async isEnabled(workspaceId: string, universalIdentifier: string) {
    const application = await this.applications.findOneBy({
      workspaceId,
      universalIdentifier,
      state: ApplicationState.INSTALLED,
    });
    if (!application) return false;
    const setting = await this.settings.findOneBy({
      workspaceId,
      key: this.key(universalIdentifier),
      userId: IsNull(),
      applicationId: IsNull(),
    });
    return (setting?.value as unknown) === 'enabled';
  }

  async assertEnabled(workspaceId: string, universalIdentifier: string) {
    if (!(await this.isEnabled(workspaceId, universalIdentifier)))
      throw new ForbiddenException('NATIVE_APP_DISABLED');
  }

  async list(workspaceId: string) {
    return Promise.all(
      NATIVE_APP_MANIFESTS.map(async (manifest) => ({
        universalIdentifier: manifest.universalIdentifier,
        displayName: manifest.displayName,
        version: manifest.version,
        hostCapability: manifest.hostCapability,
        isEnabled: await this.isEnabled(
          workspaceId,
          manifest.universalIdentifier,
        ),
      })),
    );
  }

  async manage(
    workspaceId: string,
    universalIdentifier: string,
    action: NativeAppAction,
  ) {
    const manifest = NATIVE_APP_MANIFESTS.find(
      (item) => item.universalIdentifier === universalIdentifier,
    );
    if (!manifest)
      throw new BadRequestException('NATIVE_APP_CAPABILITY_UNSUPPORTED');
    const capabilityCheck = checkNativeAppHostCapability({
      declaration: manifest.hostCapability,
      universalIdentifier: manifest.universalIdentifier,
      appVersion: manifest.version,
    });
    if (!capabilityCheck.compatible)
      throw new BadRequestException({
        message: capabilityCheck.message,
        error: capabilityCheck.reason,
        statusCode: 400,
      });
    if (
      !['install', 'enable', 'disable', 'uninstall', 'upgrade'].includes(action)
    )
      throw new BadRequestException('NATIVE_APP_ACTION_INVALID');
    await this.applications.manager.transaction(async (manager) => {
      // Serializes lifecycle changes across server processes without adding a schema table.
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `native-app:${workspaceId}:${universalIdentifier}`,
      ]);
      const repository = manager.getRepository(ApplicationEntity);
      let application = await repository.findOneBy({
        workspaceId,
        universalIdentifier,
      });
      if (!application && !['install', 'upgrade'].includes(action))
        throw new BadRequestException('NATIVE_APP_NOT_INSTALLED');
      if (!application) {
        application = await repository.save(
          repository.create({
            workspaceId,
            universalIdentifier,
            name: manifest.displayName,
            description: `Native application requiring ${manifest.hostCapability}`,
            version: manifest.version,
            sourceType: ApplicationRegistrationSourceType.LOCAL,
            sourcePath: `native://${universalIdentifier}`,
            state: ApplicationState.INSTALLED,
            // Native data has a separate, non-destructive lifecycle.
            canBeUninstalled: false,
          }),
        );
      } else if (['install', 'enable', 'upgrade'].includes(action)) {
        await repository.update(application.id, {
          name: manifest.displayName,
          version: manifest.version,
          sourceType: ApplicationRegistrationSourceType.LOCAL,
          sourcePath: `native://${universalIdentifier}`,
          state: ApplicationState.INSTALLED,
          canBeUninstalled: false,
        });
      }
      const settingRepository = manager.getRepository(KeyValuePairEntity);
      const key = this.key(universalIdentifier);
      const existing = await settingRepository.findOneBy({
        workspaceId,
        key,
        userId: IsNull(),
        applicationId: IsNull(),
      });
      const value = (['disable', 'uninstall'].includes(action)
        ? 'disabled'
        : 'enabled') as unknown as JSON;
      await settingRepository.save(
        settingRepository.create({
          ...(existing ?? {}),
          workspaceId,
          key,
          value,
          type: KeyValuePairType.CONFIG_VARIABLE,
          userId: null,
          applicationId: null,
        }),
      );
      const commandRepository = manager.getRepository(CommandMenuItemEntity);

      for (const command of manifest.commands ?? []) {
        if (!('label' in command)) continue;

        const existingCommand = await commandRepository.findOneBy({
          workspaceId,
          universalIdentifier: command.key,
        });

        await commandRepository.save(
          commandRepository.create({
            ...(existingCommand ?? {}),
            workspaceId,
            applicationId: application.id,
            universalIdentifier: command.key,
            label: command.label,
            shortLabel: command.shortLabel,
            icon: command.icon,
            position: command.position,
            isPinned: command.isPinned,
            availabilityType:
              command.availabilityType as CommandMenuItemAvailabilityType,
            conditionalAvailabilityExpression:
              command.conditionalAvailabilityExpression,
            engineComponentKey: EngineComponentKey.NATIVE_APP_COMMAND,
            isActive: !['disable', 'uninstall'].includes(action),
          }),
        );
      }
      const inventory = this.resourceInventories.get(universalIdentifier);
      if (inventory && ['install', 'upgrade'].includes(action)) {
        const resources = await inventory(workspaceId, manager);
        const ownershipKey = `native-app:${universalIdentifier}:resources`;
        const ownership = await settingRepository.findOneBy({
          workspaceId,
          key: ownershipKey,
          userId: IsNull(),
          applicationId: IsNull(),
        });
        await settingRepository.save(
          settingRepository.create({
            ...(ownership ?? {}),
            workspaceId,
            key: ownershipKey,
            value: { version: manifest.version, resources } as unknown as JSON,
            type: KeyValuePairType.CONFIG_VARIABLE,
            userId: null,
            applicationId: null,
          }),
        );
      }
    });
    await this.workspaceCache.invalidateAndRecompute(workspaceId, [
      'flatApplicationMaps',
      'flatCommandMenuItemMaps',
    ]);
    return this.list(workspaceId);
  }

  private key(universalIdentifier: string) {
    return `native-app:${universalIdentifier}:state`;
  }
}
